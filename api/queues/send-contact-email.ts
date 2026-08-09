import { handleCallback } from "@vercel/queue";
import { sendEmail } from "./_send-email";

/**
 * Consumes the `contact-messages` topic and does the actual SMTP send.
 *
 * Private by construction: the `experimentalTriggers` entry in `vercel.json`
 * binds this file to the topic and removes its public URL, so only Vercel's
 * queue infrastructure can invoke it. It has no `_` prefix precisely because it
 * must remain a function — the trigger is what makes it unreachable, not the
 * filename.
 *
 * Throwing is the retry signal: the SDK acknowledges a message when the handler
 * resolves and redelivers it when the handler throws. `sendEmail` never throws,
 * so failures are rethrown here deliberately.
 *
 * Delivery is at-least-once, so this handler can run twice for one submission.
 * The consequence is a duplicate email in an inbox, which is the right trade
 * against silently dropping a message.
 */

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

interface RetryMetadata {
  deliveryCount: number;
  messageId: string;
}

/**
 * Vercel Queues has no dead-letter queue, so an unfixable message would retry
 * until it expires. After MAX_ATTEMPTS the message is acknowledged and logged
 * in full — those logs are the only recovery path, which is exactly why the
 * whole submission is written out rather than just an id.
 */
const MAX_ATTEMPTS = 10;

export const retry = (_error: unknown, metadata: RetryMetadata) => {
  if (metadata.deliveryCount > MAX_ATTEMPTS) {
    return { acknowledge: true as const };
  }

  // Exponential, capped at 5 minutes: a Gmail blip clears in seconds, a quota
  // block takes hours, and this covers roughly 40 minutes across the attempts.
  return { afterSeconds: Math.min(300, 2 ** metadata.deliveryCount * 5) };
};

export async function deliverContactEmail(
  message: ContactMessage,
  metadata: RetryMetadata,
) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, CONTACT_TO_EMAIL } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !CONTACT_TO_EMAIL) {
    // Worth retrying rather than dropping: the operator can set the variables
    // and redeploy, and the message survives up to seven days waiting for that.
    throw new Error(
      "[contact] missing env: GMAIL_USER, GMAIL_APP_PASSWORD and CONTACT_TO_EMAIL are all required",
    );
  }

  const sent = await sendEmail({
    user: GMAIL_USER,
    appPassword: GMAIL_APP_PASSWORD,
    to: CONTACT_TO_EMAIL,
    replyTo: message.email,
    subject: `Portfolio contact from ${message.name}`,
    text: `From: ${message.name} <${message.email}>\n\n${message.message}`,
  });

  if (!sent.ok) {
    if (metadata.deliveryCount > MAX_ATTEMPTS) {
      console.error(
        `[contact] giving up after ${metadata.deliveryCount} attempts on ${metadata.messageId}. ` +
          `Unsent submission: ${JSON.stringify(message)}`,
      );
    }

    // Rethrown so the SDK redelivers. The error string can echo credentials,
    // so it goes to logs only — nothing here reaches a visitor.
    throw new Error(sent.error);
  }
}

export const POST = handleCallback(deliverContactEmail, { retry });
