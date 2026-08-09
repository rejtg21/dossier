import { randomUUID } from "node:crypto";
import {
  DeliveryError,
  deliverContactEmail,
} from "../queues/_send-contact-email";
import { validateSubmission } from "./_validate";

/**
 * `POST /api/contact` — validates a submission and sends it.
 *
 * Delivery is synchronous: Vercel Queues needs a Pro plan, so this calls the
 * delivery path directly instead of publishing to a topic. The queue code is
 * still here and still tested — see `api/queues/_send-contact-email.ts` for how
 * to switch back.
 *
 * What survives the loss of the queue, and what does not:
 *
 * - Still works: a failed send is archived to Blob, because
 *   `deliverContactEmail` emits `email-failed` either way. Nothing is lost.
 * - Gone: automatic retries. There is no redelivery, so a submission that fails
 *   stays in `contacts.json` until it is dealt with by hand.
 * - The visitor now waits on SMTP, so this responds 200 (sent) rather than 202
 *   (accepted).
 *
 * Three outcomes reach the visitor, not two:
 *
 *   sent                        -> 200
 *   not sent, but archived      -> 200, because their message did reach a human
 *   not sent and not archived   -> 502, the only case genuinely worth telling
 *                                  them about
 *
 * Layout here is dictated by Vercel, not preference:
 *
 * - Functions are only detected in an `api/` directory at the project root.
 * - Every sibling file is prefixed `_` because Vercel turns each file under
 *   `api/` into an endpoint unless it starts with `_` or `.`, or ends in
 *   `.d.ts`. Without the prefix, `_validate.test.ts` would be live at
 *   `/api/contact/validate.test`.
 * - Imports are relative: tsconfig path mappings are not supported in `api/`.
 *
 * Not reachable under `next dev` or `serve out` — the site is a static export,
 * so nothing local serves `/api`. Use `vercel dev` to exercise it.
 */

const GENERIC_FAILURE =
  "Something went wrong sending your message. Please email me directly.";

const json = (body: unknown, status: number, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const handler = {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, { Allow: "POST" });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Expected a JSON body." }, 400);
    }

    const result = validateSubmission(body);

    if (!result.ok) {
      return json({ errors: result.errors }, 400);
    }

    // Silently accept: a bot told it was caught learns to avoid the trap, and
    // the visitor-facing response should look identical either way.
    if (result.value.isSpam) {
      return json({ ok: true }, 200);
    }

    const { name, email, message } = result.value;

    try {
      await deliverContactEmail(
        { name, email, message },
        // Stands in for the queue's metadata. `deliveryCount: 1` is honest:
        // without a queue this is the only attempt there will ever be.
        { messageId: randomUUID(), deliveryCount: 1 },
      );
    } catch (cause) {
      // Detail can echo credentials, so it goes to logs only.
      console.error(`[contact] send failed: ${String(cause)}`);

      // The mail did not go out, but if the submission reached storage it is
      // not lost — it will be picked up from `contacts.json` and answered by
      // hand. From the visitor's side that is a success: they got their message
      // to a human. Only an unarchived failure is worth troubling them with.
      if (cause instanceof DeliveryError && cause.archived) {
        return json({ ok: true }, 200);
      }

      return json({ error: GENERIC_FAILURE }, 502);
    }

    return json({ ok: true }, 200);
  },
};

export default handler;
