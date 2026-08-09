import type { ContactEnv, FieldName, SendEmail } from "./_types";
import { validateSubmission } from "./_validate";

export interface HandlerResult {
  status: number;
  body: { ok: true } | { error: string } | { errors: Partial<Record<FieldName, string>> };
}

const GENERIC_FAILURE =
  "Something went wrong sending your message. Please email me directly.";

/**
 * The whole request/response decision, with no platform types in sight — the
 * Vercel Function in `api/contact.ts` is only an adapter around this. That is
 * what makes the interesting behaviour (validation, spam, misconfiguration,
 * provider failure) testable without a running server.
 */
export async function handleSubmission(
  rawBody: unknown,
  env: ContactEnv,
  sendEmail: SendEmail,
): Promise<HandlerResult> {
  const result = validateSubmission(rawBody);

  if (!result.ok) {
    return { status: 400, body: { errors: result.errors } };
  }

  // Silently accept: a bot that is told it was caught learns to avoid the trap,
  // and the visitor-facing response should look identical either way.
  if (result.value.isSpam) {
    return { status: 200, body: { ok: true } };
  }

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = env;

  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    // A misconfigured deploy is an operator problem, not a visitor problem, so
    // the visitor gets the generic message and the detail goes to the logs.
    console.error(
      "[contact] missing env: RESEND_API_KEY, CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL are all required",
    );
    return { status: 500, body: { error: GENERIC_FAILURE } };
  }

  const { name, email, message } = result.value;

  const sent = await sendEmail({
    apiKey: RESEND_API_KEY,
    to: CONTACT_TO_EMAIL,
    from: CONTACT_FROM_EMAIL,
    replyTo: email,
    subject: `Portfolio contact from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });

  if (!sent.ok) {
    console.error(`[contact] send failed: ${sent.error}`);
    return { status: 502, body: { error: GENERIC_FAILURE } };
  }

  return { status: 200, body: { ok: true } };
}
