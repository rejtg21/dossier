// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get, put } from "@vercel/blob";

import {
  contactsPathname,
  removeFailure,
  saveFailure,
  type FailedContact,
} from "./_contacts-store";

// Hoisted with the mock factory, which is lifted above ordinary declarations.
const PreconditionFailed = vi.hoisted(
  () => class PreconditionFailed extends Error {},
);

vi.mock("@vercel/blob", () => ({
  get: vi.fn(),
  put: vi.fn(),
  BlobPreconditionFailedError: PreconditionFailed,
}));

const read = vi.mocked(get);
const write = vi.mocked(put);

const entry = (messageId: string): FailedContact => ({
  messageId,
  submission: {
    name: "Rej",
    email: "someone@example.com",
    message: "Hello there.",
  },
  attempts: 1,
  error: "535 auth rejected",
  failedAt: "2026-08-10T00:00:00.000Z",
});

/** Shapes a `get` result the way the SDK returns one. */
const existing = (entries: FailedContact[], etag = "etag-1") =>
  ({
    statusCode: 200,
    stream: new Response(JSON.stringify(entries)).body,
    blob: { etag },
  }) as unknown as Awaited<ReturnType<typeof get>>;

/** The JSON actually handed to `put`. */
const written = (call = 0) => JSON.parse(write.mock.calls[call][1] as string);

beforeEach(() => {
  read.mockResolvedValue(null);
  write.mockResolvedValue({} as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("contactsPathname", () => {
  it("defaults to contacts.json", () => {
    expect(contactsPathname()).toBe("contacts.json");
  });

  it("uses CONTACTS_BLOB_PATHNAME when set", () => {
    vi.stubEnv("CONTACTS_BLOB_PATHNAME", "archive/preview-contacts.json");

    expect(contactsPathname()).toBe("archive/preview-contacts.json");
  });

  it("ignores a blank override rather than writing to an empty path", () => {
    vi.stubEnv("CONTACTS_BLOB_PATHNAME", "   ");

    expect(contactsPathname()).toBe("contacts.json");
  });

  it("reads and writes the overridden path", async () => {
    vi.stubEnv("CONTACTS_BLOB_PATHNAME", "archive/preview-contacts.json");

    await saveFailure(entry("msg_1"));

    expect(read.mock.calls[0][0]).toBe("archive/preview-contacts.json");
    expect(write.mock.calls[0][0]).toBe("archive/preview-contacts.json");
  });
});

describe("saveFailure", () => {
  it("creates contacts.json when it does not exist yet", async () => {
    await saveFailure(entry("msg_1"));

    const [pathname, , options] = write.mock.calls[0];
    expect(pathname).toBe(contactsPathname());
    expect(options).toMatchObject({
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    expect(written()).toHaveLength(1);
  });

  it("keeps the file private", async () => {
    await saveFailure(entry("msg_1"));

    // These are real names, emails and messages — a public URL would expose them.
    expect(write.mock.calls[0][2]).toMatchObject({ access: "private" });
  });

  it("appends to the existing contents rather than replacing them", async () => {
    read.mockResolvedValue(existing([entry("msg_1")]));

    await saveFailure(entry("msg_2"));

    expect(written().map((e: FailedContact) => e.messageId)).toEqual([
      "msg_1",
      "msg_2",
    ]);
  });

  it("updates in place when the same message fails again", async () => {
    read.mockResolvedValue(existing([entry("msg_1")]));

    await saveFailure({ ...entry("msg_1"), attempts: 4 });

    const stored = written();
    expect(stored).toHaveLength(1);
    expect(stored[0].attempts).toBe(4);
  });

  it("writes conditionally on the ETag it read", async () => {
    read.mockResolvedValue(existing([], "etag-abc"));

    await saveFailure(entry("msg_1"));

    expect(write.mock.calls[0][2]).toMatchObject({ ifMatch: "etag-abc" });
  });

  it("sends no ifMatch when the file is being created", async () => {
    await saveFailure(entry("msg_1"));

    expect(write.mock.calls[0][2]).not.toHaveProperty("ifMatch");
  });

  it("re-reads and retries when another writer won the race", async () => {
    read
      .mockResolvedValueOnce(existing([entry("msg_1")], "stale"))
      .mockResolvedValueOnce(existing([entry("msg_1"), entry("msg_9")], "fresh"));
    write.mockRejectedValueOnce(new PreconditionFailed("changed"));

    await saveFailure(entry("msg_2"));

    // The second attempt must include the entry the other writer added.
    expect(write).toHaveBeenCalledTimes(2);
    expect(written(1).map((e: FailedContact) => e.messageId)).toEqual([
      "msg_1",
      "msg_9",
      "msg_2",
    ]);
  });

  it("gives up after repeated contention so the queue can retry later", async () => {
    // A fresh result per read: a response body can only be consumed once.
    read.mockImplementation(async () => existing([]));
    write.mockRejectedValue(new PreconditionFailed("changed"));

    await expect(saveFailure(entry("msg_1"))).rejects.toBeInstanceOf(
      PreconditionFailed,
    );
    expect(write).toHaveBeenCalledTimes(5);
  });

  it("propagates a non-contention write error immediately", async () => {
    write.mockRejectedValue(new Error("store suspended"));

    await expect(saveFailure(entry("msg_1"))).rejects.toThrow("store suspended");
    expect(write).toHaveBeenCalledOnce();
  });

  it("refuses to overwrite an unreadable file", async () => {
    read.mockResolvedValue({
      statusCode: 200,
      stream: new Response("{ not json").body,
      blob: { etag: "e" },
    } as never);

    await expect(saveFailure(entry("msg_1"))).rejects.toThrow(/not valid JSON/);
    // The whole point: nothing is written, so nothing is destroyed.
    expect(write).not.toHaveBeenCalled();
  });

  it("refuses to overwrite a file that is not an array", async () => {
    read.mockResolvedValue({
      statusCode: 200,
      stream: new Response('{"oops":true}').body,
      blob: { etag: "e" },
    } as never);

    await expect(saveFailure(entry("msg_1"))).rejects.toThrow(/not an array/);
    expect(write).not.toHaveBeenCalled();
  });
});

describe("removeFailure", () => {
  it("drops the entry once it finally sent", async () => {
    read.mockResolvedValue(existing([entry("msg_1"), entry("msg_2")]));

    await removeFailure("msg_1");

    expect(written().map((e: FailedContact) => e.messageId)).toEqual(["msg_2"]);
  });

  it("writes nothing when the id is not stored", async () => {
    read.mockResolvedValue(existing([entry("msg_1")]));

    await removeFailure("msg_missing");

    // Only failures live here, so a success with no record is the normal case.
    expect(write).not.toHaveBeenCalled();
  });

  it("writes nothing when the file does not exist", async () => {
    await removeFailure("msg_1");

    expect(write).not.toHaveBeenCalled();
  });
});
