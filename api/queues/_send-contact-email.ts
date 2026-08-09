import { handleCallback } from "@vercel/queue";
import { registerCatchContacts } from "../listeners/_catch-contacts";
import { emit, type ContactSubmission, type EventName } from "../services/_events";
import { sendEmail } from "../services/_send-email";

/**
 * Does the actual SMTP send, and — when Queues is available — consumes the
 * `contact-messages` topic.
 *
 * Currently only the first half is live. Vercel Queues requires a Pro plan, so
 * `api/contact/index.ts` calls `deliverContactEmail` directly and this file is
 * prefixed `_`, which keeps it off the public routing table. Nothing here was
 * deleted; the `POST` export and retry policy below are intact and still
 * tested.
 *
 * To switch back once Queues is available:
 *   1. Rename this file to `send-contact-email.ts` (drop the `_`) so Vercel
 *      routes it again.
 *   2. Restore the trigger in `vercel.json`:
 *      "functions": { "api/queues/send-contact-email.ts": {
 *        "experimentalTriggers": [
 *          { "type": "queue/v2beta", "topic": "contact-messages" }
 *        ] } }
 *   3. In `api/contact/index.ts`, publish with `send` from
 *      `api/services/_queue.ts` instead of awaiting `deliverContactEmail`, and
 *      answer 202 rather than 200.
 *
 * There is no subscribe call or polling loop here, because consumption is
 * push-based. The `experimentalTriggers` entry in `vercel.json` binds this file
 * to the topic; when a message is ready, Vercel's queue infrastructure makes an
 * HTTP POST to this function. `handleCallback` is the receiving end: it decodes
 * the message and its metadata, calls the handler below, and translates the
 * outcome back — resolve acknowledges, throw redelivers.
 *
 * So the export that subscribes is `POST` at the bottom of this file, and the
 * thing doing the listening is Vercel, not this process. (Poll mode exists as
 * an alternative, via PollingQueueClient, for workers running off-platform.)
 *
 * The trigger also removes this route's public URL, so only the queue can
 * invoke it. It has no `_` prefix precisely because it must remain a function —
 * the trigger is what makes it unreachable, not the filename.
 *
 * Throwing is the retry signal: the SDK acknowledges a message when the handler
 * resolves and redelivers it when the handler throws. `sendEmail` never throws,
 * so failures are rethrown here deliberately.
 *
 * Delivery is at-least-once, so this handler can run twice for one submission.
 * The consequence is a duplicate email in an inbox, which is the right trade
 * against silently dropping a message.
 *
 * What happens to a failure is not decided here — it emits `email-failed` and
 * `catch-contacts` persists it. This module knows nothing about storage.
 */
registerCatchContacts();

interface RetryMetadata {
  deliveryCount: number;
  messageId: string;
}

/**
 * Vercel Queues has no dead-letter queue, so an unfixable message would retry
 * until it expires. After MAX_ATTEMPTS it is acknowledged — by then it is
 * already recorded in `contacts.json`, which is what makes dropping it safe.
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

/**
 * Storage problems must not change email semantics. A failed archive write is
 * logged and swallowed: the send outcome already decides whether the message is
 * redelivered, and on the failure path the next attempt archives again anyway.
 */
async function emitQuietly<E extends EventName>(
  event: E,
  payload: Parameters<typeof emit<E>>[1],
): Promise<void> {
  try {
    await emit(event, payload);
  } catch (cause) {
    console.error(`[contact] listener for ${event} failed: ${String(cause)}`);
  }
}

export async function deliverContactEmail(
  message: ContactSubmission,
  metadata: RetryMetadata,
) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, CONTACT_TO_EMAIL } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !CONTACT_TO_EMAIL) {
    // Worth retrying rather than dropping: the operator can set the variables
    // and redeploy, and the message survives up to seven days waiting for that.
    const error =
      "[contact] missing env: GMAIL_USER, GMAIL_APP_PASSWORD and CONTACT_TO_EMAIL are all required";

    await emitQuietly("email-failed", {
      messageId: metadata.messageId,
      deliveryCount: metadata.deliveryCount,
      error,
      submission: message,
    });

    throw new Error(error);
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
    await emitQuietly("email-failed", {
      messageId: metadata.messageId,
      deliveryCount: metadata.deliveryCount,
      error: sent.error,
      submission: message,
    });

    if (metadata.deliveryCount > MAX_ATTEMPTS) {
      console.error(
        `[contact] giving up on ${metadata.messageId} after ${metadata.deliveryCount} attempts; ` +
          `it is kept in contacts.json`,
      );
    }

    // Rethrown so the SDK redelivers. The error string can echo credentials,
    // so it goes to logs only — nothing here reaches a visitor.
    throw new Error(sent.error);
  }

  // Succeeded, possibly after earlier failures: clear any record of it.
  await emitQuietly("email-sent", { messageId: metadata.messageId });
}

export const POST = handleCallback(deliverContactEmail, { retry });
