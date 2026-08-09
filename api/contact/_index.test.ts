// @vitest-environment node
// Needs real Request/Response globals, which jsdom does not provide.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deliverContactEmail } from "../queues/_send-contact-email";

import handler from "./index";

vi.mock("../queues/_send-contact-email", () => ({
  deliverContactEmail: vi.fn(),
}));

const deliver = vi.mocked(deliverContactEmail);

const valid = {
  name: "Rej Mediodia",
  email: "someone@example.com",
  message: "I would like to talk about a project.",
};

const post = (body: unknown, init: RequestInit = {}) =>
  handler.fetch(
    new Request("https://example.com/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
      ...init,
    }),
  );

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  deliver.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/contact", () => {
  it("sends the submission and answers 200", async () => {
    const response = await post(valid);

    // 200, not 202: without a queue the mail is already gone by the time we
    // answer.
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(deliver).toHaveBeenCalledOnce();
  });

  it("passes just the submission through to delivery", async () => {
    await post({ ...valid, company: "" });

    const [submission] = deliver.mock.calls[0];
    expect(submission).toEqual(valid);
    // The honeypot is a transport detail and must not reach the mailer.
    expect(submission).not.toHaveProperty("company");
  });

  it("gives each submission its own message id", async () => {
    await post(valid);
    await post(valid);

    const first = deliver.mock.calls[0][1].messageId;
    const second = deliver.mock.calls[1][1].messageId;

    // The id keys the Blob archive entry; a shared one would overwrite.
    expect(first).toEqual(expect.any(String));
    expect(first).not.toBe(second);
  });

  it("reports a single delivery attempt", async () => {
    await post(valid);

    // Honest: with no queue there is no redelivery, so this is the only try.
    expect(deliver.mock.calls[0][1].deliveryCount).toBe(1);
  });

  it("returns 400 with field errors and sends nothing when invalid", async () => {
    const response = await post({ ...valid, email: "nope" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toHaveProperty("errors.email");
    expect(deliver).not.toHaveBeenCalled();
  });

  it("accepts a honeypot submission but never sends it", async () => {
    const response = await post({ ...valid, company: "Acme Corp" });

    // Indistinguishable from success on the wire, by design.
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(deliver).not.toHaveBeenCalled();
  });

  it("returns 502 when delivery fails", async () => {
    deliver.mockRejectedValue(new Error("535 auth rejected"));

    const response = await post(valid);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toHaveProperty("error");
  });

  it("never leaks delivery failure detail to the caller", async () => {
    deliver.mockRejectedValue(
      new Error("535 auth rejected for abcd efgh ijkl mnop"),
    );

    const response = await post(valid);

    expect(JSON.stringify(await response.json())).not.toContain("abcd efgh");
  });

  it("rejects a malformed JSON body", async () => {
    const response = await post("{ not json");

    expect(response.status).toBe(400);
    expect(deliver).not.toHaveBeenCalled();
  });

  it("rejects a non-POST method and advertises what it accepts", async () => {
    const response = await handler.fetch(
      new Request("https://example.com/api/contact", { method: "GET" }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(deliver).not.toHaveBeenCalled();
  });

  it("answers with JSON", async () => {
    const response = await post(valid);

    expect(response.headers.get("Content-Type")).toContain("application/json");
  });
});
