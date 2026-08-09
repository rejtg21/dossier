import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import type { ContactSubmission } from "./_events";

export const CONTACTS_PATHNAME = "contacts.json";

/**
 * How many times to redo the read-modify-write when another invocation wrote
 * first. Contention is rare — only failed sends touch this file — so a handful
 * of attempts is plenty. Exhausting them throws, which lets the queue redeliver
 * the message and try again later.
 */
const MAX_WRITE_ATTEMPTS = 5;

export interface FailedContact {
  messageId: string;
  submission: ContactSubmission;
  attempts: number;
  error: string;
  failedAt: string;
}

interface Snapshot {
  entries: FailedContact[];
  /** Absent when the file does not exist yet. */
  etag?: string;
}

async function read(): Promise<Snapshot> {
  const result = await get(CONTACTS_PATHNAME, { access: "private" });

  // `get` resolves to null rather than throwing when the blob is absent, which
  // is the first-write case: there is nothing to merge into.
  if (!result || result.statusCode !== 200) return { entries: [] };

  const text = await new Response(result.stream).text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Refuse rather than start fresh: overwriting an unreadable file would
    // destroy every submission it still holds.
    throw new Error(
      `[contacts] ${CONTACTS_PATHNAME} is not valid JSON; refusing to overwrite it`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      `[contacts] ${CONTACTS_PATHNAME} is not an array; refusing to overwrite it`,
    );
  }

  return { entries: parsed as FailedContact[], etag: result.blob.etag };
}

/**
 * Read-modify-write guarded by the blob's ETag.
 *
 * Two consumers can fail at the same moment, and a plain read-then-write would
 * let the second overwrite the first — a silently lost submission. `ifMatch`
 * makes the write conditional on the file not having changed since the read;
 * when it has, `BlobPreconditionFailedError` sends us round again with fresh
 * contents. That is a compare-and-swap, so no lock is needed.
 *
 * `mutate` returning the array it was given means "nothing to do", and skips
 * the write entirely.
 */
async function update(
  mutate: (entries: FailedContact[]) => FailedContact[],
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt++) {
    const { entries, etag } = await read();
    const next = mutate(entries);

    if (next === entries) return;

    try {
      await put(CONTACTS_PATHNAME, JSON.stringify(next, null, 2), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        ...(etag ? { ifMatch: etag } : {}),
      });
      return;
    } catch (cause) {
      const lostRace = cause instanceof BlobPreconditionFailedError;
      if (!lostRace || attempt === MAX_WRITE_ATTEMPTS) throw cause;
    }
  }
}

/**
 * Records a failed submission, keyed by message id so redeliveries update the
 * existing entry instead of piling up duplicates.
 */
export async function saveFailure(entry: FailedContact): Promise<void> {
  await update((entries) => {
    const others = entries.filter((e) => e.messageId !== entry.messageId);
    return [...others, entry];
  });
}

/** Drops a submission once it finally sent: only failures belong in the file. */
export async function removeFailure(messageId: string): Promise<void> {
  await update((entries) => {
    const next = entries.filter((e) => e.messageId !== messageId);
    // Same reference when nothing matched — no write, no wasted ETag round.
    return next.length === entries.length ? entries : next;
  });
}
