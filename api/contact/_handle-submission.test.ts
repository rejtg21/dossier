import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleSubmission } from "./_handle-submission";
import type { ContactEnv, SendEmail } from "./_types";

const valid = {
  name: "Rej Mediodia",
  email: "someone@example.com",
  message: "I would like to talk about a project.",
};

const env: ContactEnv = {
  RESEND_API_KEY: "re_test",
  CONTACT_TO_EMAIL: "inbox@example.com",
  CONTACT_FROM_EMAIL: "site@example.com",
};

const sendOk: SendEmail = async () => ({ ok: true });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("handleSubmission", () => {
  it("sends the email and returns 200 for a valid submission", async () => {
    const send = vi.fn<SendEmail>(async () => ({ ok: true }));

    const result = await handleSubmission(valid, env, send);

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(send).toHaveBeenCalledOnce();
  });

  it("puts the visitor's address in replyTo, not in from", async () => {
    const send = vi.fn<SendEmail>(async () => ({ ok: true }));

    await handleSubmission(valid, env, send);

    // `from` must stay on the verified domain or Resend rejects the send.
    expect(send.mock.calls[0][0]).toMatchObject({
      from: "site@example.com",
      to: "inbox@example.com",
      replyTo: "someone@example.com",
    });
  });

  it("includes the name and message in the email body", async () => {
    const send = vi.fn<SendEmail>(async () => ({ ok: true }));

    await handleSubmission(valid, env, send);

    const { text, subject } = send.mock.calls[0][0];
    expect(subject).toContain("Rej Mediodia");
    expect(text).toContain("someone@example.com");
    expect(text).toContain("I would like to talk about a project.");
  });

  it("returns 400 with field errors and sends nothing when invalid", async () => {
    const send = vi.fn<SendEmail>(async () => ({ ok: true }));

    const result = await handleSubmission({ ...valid, email: "nope" }, env, send);

    expect(result.status).toBe(400);
    expect(result.body).toHaveProperty("errors");
    expect(send).not.toHaveBeenCalled();
  });

  it("accepts a honeypot submission but never sends it", async () => {
    const send = vi.fn<SendEmail>(async () => ({ ok: true }));

    const result = await handleSubmission(
      { ...valid, company: "Acme Corp" },
      env,
      send,
    );

    // Indistinguishable from success on the wire, by design.
    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(send).not.toHaveBeenCalled();
  });

  it.each(["RESEND_API_KEY", "CONTACT_TO_EMAIL", "CONTACT_FROM_EMAIL"] as const)(
    "returns 500 without sending when %s is missing",
    async (key) => {
      const send = vi.fn<SendEmail>(async () => ({ ok: true }));
      const broken = { ...env, [key]: undefined };

      const result = await handleSubmission(valid, broken, send);

      expect(result.status).toBe(500);
      expect(send).not.toHaveBeenCalled();
    },
  );

  it("returns 502 when the provider fails", async () => {
    const send: SendEmail = async () => ({ ok: false, error: "boom" });

    const result = await handleSubmission(valid, env, send);

    expect(result.status).toBe(502);
    expect(result.body).toHaveProperty("error");
  });

  it("never leaks provider detail to the caller", async () => {
    const send: SendEmail = async () => ({
      ok: false,
      error: "Resend responded 401: invalid api key re_secret",
    });

    const result = await handleSubmission(valid, env, send);

    expect(JSON.stringify(result.body)).not.toContain("re_secret");
  });

  it("does not send when the body is not an object", async () => {
    const send = vi.fn<SendEmail>(sendOk);

    const result = await handleSubmission("garbage", env, send);

    expect(result.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
});
