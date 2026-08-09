// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetTransporter, sendEmail } from "./_send-email";

const sendMail = vi.hoisted(() => vi.fn());
const createTransport = vi.hoisted(() => vi.fn());

vi.mock("nodemailer", () => ({ default: { createTransport } }));

const args = {
  user: "site@gmail.com",
  appPassword: "abcd efgh ijkl mnop",
  to: "inbox@example.com",
  replyTo: "someone@example.com",
  subject: "Portfolio contact from Rej",
  text: "Hello.",
};

beforeEach(() => {
  vi.clearAllMocks();
  resetTransporter();
  createTransport.mockReturnValue({ sendMail });
  sendMail.mockResolvedValue({ messageId: "1" });
});

describe("sendEmail", () => {
  it("authenticates against Gmail with the app password", async () => {
    await sendEmail(args);

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        service: "gmail",
        auth: { user: "site@gmail.com", pass: "abcd efgh ijkl mnop" },
      }),
    );
  });

  it("sends from the authenticated account, not the visitor", async () => {
    await sendEmail(args);

    // Gmail rewrites any other sender, and spoofing one fails SPF/DKIM.
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "site@gmail.com",
        to: "inbox@example.com",
        replyTo: "someone@example.com",
      }),
    );
  });

  it("reuses one transporter across invocations", async () => {
    await sendEmail(args);
    await sendEmail(args);

    // A warm instance must not pay the TLS handshake twice.
    expect(createTransport).toHaveBeenCalledOnce();
    expect(sendMail).toHaveBeenCalledTimes(2);
  });

  it("reports failure instead of throwing", async () => {
    sendMail.mockRejectedValue(new Error("535 auth rejected"));

    const result = await sendEmail(args);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("535 auth rejected");
  });

  it("reports a connection failure instead of throwing", async () => {
    createTransport.mockImplementation(() => {
      throw new Error("ECONNREFUSED");
    });

    const result = await sendEmail(args);

    expect(result.ok).toBe(false);
  });

  it("returns ok on success", async () => {
    await expect(sendEmail(args)).resolves.toEqual({ ok: true });
  });
});
