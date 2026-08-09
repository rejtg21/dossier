import { send } from "@vercel/queue";
import { validateSubmission } from "./_validate";

/**
 * `POST /api/contact` — validates a submission and queues it for delivery.
 *
 * This endpoint does not send the email. It publishes to the `contact-messages`
 * topic and returns immediately; `api/queues/send-contact-email.ts` consumes
 * the topic and does the SMTP work, so a Gmail outage or a timeout retries in
 * the background instead of failing the visitor's request.
 *
 * That makes the response 202, not 200: the message is accepted, not yet sent.
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

export const CONTACT_TOPIC = "contact-messages";

/**
 * Contact messages are irreplaceable — a lost one is a lost client — so they
 * outlive the 24h default. Seven days is the maximum the platform allows, and
 * it means a message published before a misconfiguration is fixed still lands
 * once the fix deploys.
 */
const RETENTION_SECONDS = 604_800;

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
    // the visitor-facing response should look identical either way. Dropped
    // before the queue so spam never costs a delivery attempt.
    if (result.value.isSpam) {
      return json({ ok: true }, 202);
    }

    const { name, email, message } = result.value;

    try {
      await send(
        CONTACT_TOPIC,
        { name, email, message },
        { retentionSeconds: RETENTION_SECONDS },
      );
    } catch (cause) {
      // The queue itself is unreachable, so there is nothing to retry against
      // and the visitor needs to know their message did not land.
      console.error(`[contact] enqueue failed: ${String(cause)}`);
      return json({ error: GENERIC_FAILURE }, 502);
    }

    return json({ ok: true }, 202);
  },
};

export default handler;
