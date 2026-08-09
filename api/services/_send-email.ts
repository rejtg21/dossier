import nodemailer, { type Transporter } from "nodemailer";

interface SendEmailArgs {
  /** The Gmail address that authenticates. Gmail forces it to be the sender. */
  user: string;
  /** A 16-character Google App Password, not the account password. */
  appPassword: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

/**
 * Cached across invocations on purpose: a warm function instance reuses the
 * pooled SMTP connection instead of paying the TLS handshake every time.
 * Credentials cannot change within an instance, so caching on first use is safe.
 */
let transporter: Transporter | undefined;

const getTransporter = (user: string, appPassword: string): Transporter => {
  transporter ??= nodemailer.createTransport({
    service: "gmail",
    pool: true,
    // Google shows the password as four groups of four for readability, but
    // the secret is the 16 characters alone. Pasting it verbatim is the usual
    // cause of a 535, and the value never legitimately contains whitespace.
    auth: { user, pass: appPassword.replace(/\s/g, "") },
  });

  return transporter;
};

/** Test seam: the module-level cache would otherwise leak between cases. */
export const resetTransporter = () => {
  transporter = undefined;
};

/**
 * Sends through Gmail's SMTP using a Google App Password.
 *
 * `from` is the authenticated account rather than the visitor: Gmail rewrites
 * any other sender, and spoofing one would fail SPF/DKIM and land in spam.
 * The visitor's address goes in `replyTo`, so replying from the inbox still
 * reaches them.
 *
 * Requires 2-Step Verification on the Google account — App Passwords cannot be
 * created without it. Gmail also caps sending (roughly 500/day on a free
 * account, 2,000 on Workspace), which is ample for a contact form but is a real
 * ceiling.
 *
 * Never throws: the caller decides what a failure means, and the error string
 * is for logs only. It can echo credentials back, so it must never reach a
 * response body.
 */
export async function sendEmail({
  user,
  appPassword,
  to,
  replyTo,
  subject,
  text,
}: SendEmailArgs): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await getTransporter(user, appPassword).sendMail({
      from: user,
      to,
      replyTo,
      subject,
      text,
    });
  } catch (cause) {
    return { ok: false, error: `Gmail SMTP send failed: ${String(cause)}` };
  }

  return { ok: true };
}
