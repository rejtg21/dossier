import { handleSubmission } from "../server/contact/handle-submission";
import { sendEmail } from "../server/contact/send-email";

/**
 * The Vercel Function entry point.
 *
 * It must live in `api/` at the project root — that directory name is the
 * convention Vercel detects, and `vercel.json`'s `functions` key only tunes
 * functions it already found, it cannot promote another folder into one. So
 * this file stays a thin adapter and all the logic lives in `server/`.
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
