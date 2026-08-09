import type { SendEmailArgs } from "./_types";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/**
 * Posts to Resend's REST API directly rather than pulling in the SDK: it is one
 * request, and a dependency-free module is trivial to test with an injected
 * `fetch`.
 *
 * `replyTo` is the visitor's address, so replying from the inbox reaches them —
 * `from` must stay on a domain verified with Resend or the send is rejected.
 */
export async function sendEmail(
  { apiKey, to, from, replyTo, subject, text }: SendEmailArgs,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  let response: Response;

  try {
    response = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: replyTo,
        subject,
        text,
      }),
    });
  } catch (cause) {
    return { ok: false, error: `Request to Resend failed: ${String(cause)}` };
  }

  if (!response.ok) {
    // Body may be JSON or empty; either way it is only ever logged server-side.
    const detail = await response.text().catch(() => "");
    return {
      ok: false,
      error: `Resend responded ${response.status}: ${detail.slice(0, 500)}`,
    };
  }

  return { ok: true };
}
