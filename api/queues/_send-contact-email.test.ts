// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { removeFailure, saveFailure } from "../services/_contacts-store";
import { sendEmail } from "../services/_send-email";
import {
  DeliveryError,
  deliverContactEmail,
  retry,
} from "./_send-contact-email";

// handleCallback would try to configure a queue client at import time.
vi.mock("@vercel/queue", () => ({ handleCallback: (fn: unknown) => fn }));
vi.mock("../services/_send-email", () => ({ sendEmail: vi.fn() }));
// The event bus and catch-contacts listener stay real, so these cases cover
// the whole emit -> listener -> store path.
vi.mock("../services/_contacts-store", () => ({
  saveFailure: vi.fn(),
  removeFailure: vi.fn(),
}));

const send = vi.mocked(sendEmail);
const save = vi.mocked(saveFailure);
const remove = vi.mocked(removeFailure);

const message = {
  name: "Rej Mediodia",
  email: "someone@example.com",
  message: "I would like to talk about a project.",
};

const meta = (deliveryCount = 1) => ({ deliveryCount, messageId: "msg_1" });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  send.mockResolvedValue({ ok: true });
  // Explicit defaults: clearAllMocks resets calls but keeps implementations, so
  // a mockRejectedValue in one case would otherwise leak into the next.
  save.mockResolvedValue(undefined);
  remove.mockResolvedValue(undefined);
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

  it("stores the submission when the send fails", async () => {
    send.mockResolvedValue({ ok: false, error: "535 auth rejected" });

    await expect(deliverContactEmail(message, meta(2))).rejects.toThrow();

    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0]).toMatchObject({
      messageId: "msg_1",
      attempts: 2,
      submission: message,
    });
  });

  it("stores the submission when the env is missing", async () => {
    vi.stubEnv("GMAIL_USER", "");

    await expect(deliverContactEmail(message, meta())).rejects.toThrow();

    expect(save).toHaveBeenCalledOnce();
  });

  it("clears the record once a retry finally succeeds", async () => {
    await deliverContactEmail(message, meta(3));

    expect(remove).toHaveBeenCalledWith("msg_1");
    expect(save).not.toHaveBeenCalled();
  });

  it("still reports the send failure when storing fails", async () => {
    send.mockResolvedValue({ ok: false, error: "535 auth rejected" });
    save.mockRejectedValue(new Error("blob unavailable"));

    // Storage problems must not change email semantics: the message still
    // needs redelivering, so the send error is what propagates.
    await expect(deliverContactEmail(message, meta())).rejects.toThrow(
      /535 auth rejected/,
    );
  });

  it("marks the failure archived when the submission was stored", async () => {
    send.mockResolvedValue({ ok: false, error: "535 auth rejected" });

    // The caller uses this to decide whether the visitor sees a failure.
    await expect(deliverContactEmail(message, meta())).rejects.toMatchObject({
      archived: true,
    });
  });

  it("marks the failure unarchived when storing failed too", async () => {
    send.mockResolvedValue({ ok: false, error: "535 auth rejected" });
    save.mockRejectedValue(new Error("blob unavailable"));

    await expect(deliverContactEmail(message, meta())).rejects.toMatchObject({
      archived: false,
    });
  });

  it("throws a DeliveryError so the caller can read the flag", async () => {
    send.mockResolvedValue({ ok: false, error: "535 auth rejected" });

    await expect(deliverContactEmail(message, meta())).rejects.toBeInstanceOf(
      DeliveryError,
    );
  });

  it("reports the archive state when the env is missing too", async () => {
    vi.stubEnv("GMAIL_USER", "");

    await expect(deliverContactEmail(message, meta())).rejects.toMatchObject({
      archived: true,
    });
  });

  it("does not fail a successful send when clearing the record fails", async () => {
    remove.mockRejectedValue(new Error("blob unavailable"));

    // Rethrowing here would resend an email that already went out.
    await expect(deliverContactEmail(message, meta())).resolves.toBeUndefined();
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
