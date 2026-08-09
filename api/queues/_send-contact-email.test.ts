// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendEmail } from "./_send-email";
import { deliverContactEmail, retry } from "./send-contact-email";

// handleCallback would try to configure a queue client at import time.
vi.mock("@vercel/queue", () => ({ handleCallback: (fn: unknown) => fn }));
vi.mock("./_send-email", () => ({ sendEmail: vi.fn() }));

const send = vi.mocked(sendEmail);

const message = {
  name: "Rej Mediodia",
  email: "someone@example.com",
  message: "I would like to talk about a project.",
};

const meta = (deliveryCount = 1) => ({ deliveryCount, messageId: "msg_1" });

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

describe("deliverContactEmail", () => {
  it("sends with the visitor as replyTo and resolves", async () => {
    await expect(
      deliverContactEmail(message, meta()),
    ).resolves.toBeUndefined();

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        user: "site@gmail.com",
        to: "inbox@example.com",
        replyTo: "someone@example.com",
      }),
    );
  });

  it("carries the name and message into the email", async () => {
    await deliverContactEmail(message, meta());

    const { subject, text } = send.mock.calls[0][0];
    expect(subject).toContain("Rej Mediodia");
    expect(text).toContain("I would like to talk about a project.");
  });

  it.each(["GMAIL_USER", "GMAIL_APP_PASSWORD", "CONTACT_TO_EMAIL"] as const)(
    "throws without sending when %s is missing, so the message is retried",
    async (key) => {
      vi.stubEnv(key, "");

      await expect(deliverContactEmail(message, meta())).rejects.toThrow(
        /missing env/,
      );
      expect(send).not.toHaveBeenCalled();
    },
  );

  it("throws when the send fails, which is the redelivery signal", async () => {
    send.mockResolvedValue({ ok: false, error: "535 auth rejected" });

    await expect(deliverContactEmail(message, meta())).rejects.toThrow(
      /535 auth rejected/,
    );
  });

  it("logs the whole submission once it is about to be dropped", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockResolvedValue({ ok: false, error: "still failing" });

    await expect(deliverContactEmail(message, meta(11))).rejects.toThrow();

    // With no dead-letter queue, this log is the only recovery path.
    const output = logged.mock.calls.flat().join(" ");
    expect(output).toContain("giving up");
    expect(output).toContain("someone@example.com");
    expect(output).toContain("I would like to talk about a project.");
  });

  it("does not log the submission on an ordinary retry", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockResolvedValue({ ok: false, error: "transient" });

    await expect(deliverContactEmail(message, meta(2))).rejects.toThrow();

    expect(logged.mock.calls.flat().join(" ")).not.toContain("giving up");
  });
});

describe("retry policy", () => {
  it("backs off exponentially early on", () => {
    expect(retry(new Error("x"), meta(1))).toEqual({ afterSeconds: 10 });
    expect(retry(new Error("x"), meta(3))).toEqual({ afterSeconds: 40 });
  });

  it("caps the delay at five minutes", () => {
    expect(retry(new Error("x"), meta(10))).toEqual({ afterSeconds: 300 });
  });

  it("gives up after the attempt ceiling", () => {
    // No dead-letter queue exists, so something has to stop the redelivery.
    expect(retry(new Error("x"), meta(11))).toEqual({ acknowledge: true });
  });
});
