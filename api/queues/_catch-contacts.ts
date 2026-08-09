import { removeFailure, saveFailure } from "./_contacts-store";
import { on } from "./_events";

/**
 * The `catch-contacts` listener: the only thing in the codebase that decides a
 * failed submission should be persisted.
 *
 * The sender emits `email-failed` / `email-sent` and knows nothing about Blob;
 * this module knows nothing about SMTP. Swapping the store, or adding a second
 * listener that pings you on Slack, touches nothing else.
 */
let registered = false;

export function registerCatchContacts(): void {
  // The consumer module can be imported more than once in a warm instance, and
  // registering twice would write twice per event.
  if (registered) return;
  registered = true;

  on("email-failed", async ({ messageId, deliveryCount, error, submission }) => {
    await saveFailure({
      messageId,
      submission,
      attempts: deliveryCount,
      error,
      // Stamped here rather than passed in: the listener owns the record shape.
      failedAt: new Date().toISOString(),
    });
  });

  on("email-sent", async ({ messageId }) => {
    await removeFailure(messageId);
  });
}

/** Test seam: `registered` is module state and would leak between cases. */
export function resetCatchContacts(): void {
  registered = false;
}
