// @vitest-environment node
// Needs real Request/Response globals, which jsdom does not provide.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { send } from "@vercel/queue";

import handler, { CONTACT_TOPIC } from "./index";

vi.mock("@vercel/queue", () => ({ send: vi.fn() }));

const enqueue = vi.mocked(send);

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
  enqueue.mockResolvedValue({ messageId: "msg_1" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/contact", () => {
  it("queues the submission and answers 202 Accepted", async () => {
    const response = await post(valid);

    // 202, not 200: accepted for delivery, not yet delivered.
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(enqueue).toHaveBeenCalledOnce();
  });

  it("publishes to the contact topic with just the submission", async () => {
    await post({ ...valid, company: "" });

    const [topic, payload] = enqueue.mock.calls[0];
    expect(topic).toBe(CONTACT_TOPIC);
    expect(payload).toEqual(valid);
    // The honeypot is a transport detail and must not reach the worker.
    expect(payload).not.toHaveProperty("company");
  });

  it("keeps messages for the full retention window", async () => {
    await post(valid);

    expect(enqueue.mock.calls[0][2]).toMatchObject({
      retentionSeconds: 604_800,
    });
  });

  it("returns 400 with field errors and queues nothing when invalid", async () => {
    const response = await post({ ...valid, email: "nope" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toHaveProperty("errors.email");
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("accepts a honeypot submission but never queues it", async () => {
    const response = await post({ ...valid, company: "Acme Corp" });

    // Indistinguishable from success on the wire, by design, and spam never
    // costs a delivery attempt.
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("returns 502 when the queue is unreachable", async () => {
    enqueue.mockRejectedValue(new Error("queue down"));

    const response = await post(valid);

    // Nothing to retry against, so the visitor must be told.
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toHaveProperty("error");
  });

  it("never leaks queue failure detail to the caller", async () => {
    enqueue.mockRejectedValue(new Error("token oidc_secret_value expired"));

    const response = await post(valid);

    expect(JSON.stringify(await response.json())).not.toContain(
      "oidc_secret_value",
    );
  });

  it("rejects a malformed JSON body", async () => {
    const response = await post("{ not json");

    expect(response.status).toBe(400);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("rejects a non-POST method and advertises what it accepts", async () => {
    const response = await handler.fetch(
      new Request("https://example.com/api/contact", { method: "GET" }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("answers with JSON", async () => {
    const response = await post(valid);

    expect(response.headers.get("Content-Type")).toContain("application/json");
  });
});
