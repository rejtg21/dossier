// @vitest-environment node
// Needs real Request/Response globals, which jsdom does not provide.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import handler from "./index";
import { sendEmail } from "./_send-email";

vi.mock("./_send-email", () => ({ sendEmail: vi.fn() }));

const send = vi.mocked(sendEmail);

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
  send.mockResolvedValue({ ok: true });
  vi.stubEnv("GMAIL_USER", "site@gmail.com");
  vi.stubEnv("GMAIL_APP_PASSWORD", "abcd efgh ijkl mnop");
  vi.stubEnv("CONTACT_TO_EMAIL", "inbox@example.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/contact", () => {
  it("sends the email and returns 200 for a valid submission", async () => {
    const response = await post(valid);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(send).toHaveBeenCalledOnce();
  });

  it("puts the visitor's address in replyTo, never in the sender", async () => {
    await post(valid);

    // Gmail rewrites any sender other than the authenticated account, so the
    // visitor must arrive as replyTo or replies would go nowhere.
    expect(send.mock.calls[0][0]).toMatchObject({
      user: "site@gmail.com",
      to: "inbox@example.com",
      replyTo: "someone@example.com",
    });
  });

  it("includes the name and message in the email body", async () => {
    await post(valid);

    const { text, subject } = send.mock.calls[0][0];
    expect(subject).toContain("Rej Mediodia");
    expect(text).toContain("someone@example.com");
    expect(text).toContain("I would like to talk about a project.");
  });

  it("returns 400 with field errors and sends nothing when invalid", async () => {
    const response = await post({ ...valid, email: "nope" });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toHaveProperty("errors.email");
    expect(send).not.toHaveBeenCalled();
  });

  it("accepts a honeypot submission but never sends it", async () => {
    const response = await post({ ...valid, company: "Acme Corp" });

    // Indistinguishable from success on the wire, by design.
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(send).not.toHaveBeenCalled();
  });

  it.each(["GMAIL_USER", "GMAIL_APP_PASSWORD", "CONTACT_TO_EMAIL"] as const)(
    "returns 500 without sending when %s is missing",
    async (key) => {
      vi.stubEnv(key, "");

      const response = await post(valid);

      expect(response.status).toBe(500);
      expect(send).not.toHaveBeenCalled();
    },
  );

  it("returns 502 when the provider fails", async () => {
    send.mockResolvedValue({ ok: false, error: "boom" });

    const response = await post(valid);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toHaveProperty("error");
  });

  it("never leaks provider detail to the caller", async () => {
    send.mockResolvedValue({
      ok: false,
      error: "Gmail SMTP send failed: 535 auth rejected for abcd efgh ijkl mnop",
    });

    const response = await post(valid);

    expect(JSON.stringify(await response.json())).not.toContain("abcd efgh");
  });

  it("rejects a malformed JSON body", async () => {
    const response = await post("{ not json");

    expect(response.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects a non-POST method and advertises what it accepts", async () => {
    const response = await handler.fetch(
      new Request("https://example.com/api/contact", { method: "GET" }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(send).not.toHaveBeenCalled();
  });

  it("answers with JSON", async () => {
    const response = await post(valid);

    expect(response.headers.get("Content-Type")).toContain("application/json");
  });
});
