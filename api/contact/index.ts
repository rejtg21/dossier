import { handleSubmission } from "./_handle-submission";
import { sendEmail } from "./_send-email";

/**
 * The Vercel Function behind `POST /api/contact`.
 *
 * Layout is dictated by Vercel, not preference:
 *
 * - Functions are only detected in an `api/` directory at the project root.
 *   `vercel.json`'s `functions` key configures functions Vercel already found;
 *   it cannot promote another folder into one.
 * - Every other file in here is prefixed `_` because Vercel turns each file
 *   under `api/` into an endpoint unless it starts with `_` or `.`, or ends in
 *   `.d.ts`. Without the prefix, `_validate.test.ts` would be live at
 *   `/api/contact/validate.test`.
 * - Imports are relative: tsconfig path mappings (the `@/*` alias) are not
 *   supported inside `api/`.
 *
 * This file stays a thin adapter — parse, delegate, serialise — so the real
 * decisions live in `_handle-submission.ts` and stay testable without a server.
 *
 * Not reachable under `next dev` or `serve out`: the site is a static export,
 * so nothing local serves `/api`. Use `vercel dev` to exercise it.
 */
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

    // Named explicitly rather than passing `process.env` wholesale: it documents
    // exactly what this function reads, and `ProcessEnv` is not assignable to a
    // fully-optional type anyway.
    const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } =
      process.env;

    const { status, body: payload } = await handleSubmission(
      body,
      { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL },
      sendEmail,
    );

    return json(payload, status);
  },
};

export default handler;
