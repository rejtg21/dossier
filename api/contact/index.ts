import { sendEmail } from "./_send-email";
import { validateSubmission } from "./_validate";

/**
 * `POST /api/contact` — validates a submission and emails it on.
 *
 * Layout here is dictated by Vercel, not preference:
 *
 * - Functions are only detected in an `api/` directory at the project root.
 *   `vercel.json`'s `functions` key configures functions Vercel already found;
 *   it cannot promote another folder into one.
 * - Every sibling file is prefixed `_` because Vercel turns each file under
 *   `api/` into an endpoint unless it starts with `_` or `.`, or ends in
 *   `.d.ts`. Without the prefix, `_validate.test.ts` would be live at
 *   `/api/contact/validate.test`.
 * - Imports are relative: tsconfig path mappings (the `@/*` alias) are not
 *   supported inside `api/`.
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

    const { GMAIL_USER, GMAIL_APP_PASSWORD, CONTACT_TO_EMAIL } = process.env;

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !CONTACT_TO_EMAIL) {
      // A misconfigured deploy is an operator problem, not a visitor problem,
      // so the visitor gets the generic message and the detail goes to the logs.
      console.error(
        "[contact] missing env: GMAIL_USER, GMAIL_APP_PASSWORD and CONTACT_TO_EMAIL are all required",
      );
      return json({ error: GENERIC_FAILURE }, 500);
    }

    const { name, email, message } = result.value;

    const sent = await sendEmail({
      user: GMAIL_USER,
      appPassword: GMAIL_APP_PASSWORD,
      to: CONTACT_TO_EMAIL,
      replyTo: email,
      subject: `Portfolio contact from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    if (!sent.ok) {
      // Logged, never returned: this string can contain the API key.
      console.error(`[contact] send failed: ${sent.error}`);
      return json({ error: GENERIC_FAILURE }, 502);
    }

    return json({ ok: true }, 200);
  },
};

export default handler;
