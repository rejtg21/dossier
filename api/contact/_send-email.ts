const RESEND_ENDPOINT = "https://api.resend.com/emails";

interface SendEmailArgs {
  apiKey: string;
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  text: string;
}

/**
 * Posts to Resend's REST API directly rather than pulling in the SDK: it is one
 * request, and the dependency buys nothing here.
 *
 * `replyTo` is the visitor's address, so replying from the inbox reaches them —
 * `from` must stay on a domain verified with Resend or the send is rejected.
 *
 * Never throws: the caller decides what a failure means, and the error string
 * is for logs only. It can contain the API key echoed back by Resend, so it
 * must never reach a response body.
 */
export async function sendEmail({
  apiKey,
  to,
  from,
  replyTo,
  subject,
  text,
}: SendEmailArgs): Promise<{ ok: true } | { ok: false; error: string }> {
  let response: Response;

  try {
    response = await fetch(RESEND_ENDPOINT, {
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
    const detail = await response.text().catch(() => "");
    return {
      ok: false,
      error: `Resend responded ${response.status}: ${detail.slice(0, 500)}`,
    };
  }

  return { ok: true };
}
