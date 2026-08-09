/** The fields the browser sends. `company` is the honeypot — see `validate.ts`. */
export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  company?: string;
}

export type FieldName = "name" | "email" | "message";

export type ValidationResult =
  | { ok: true; value: ContactPayload & { isSpam: boolean } }
  | { ok: false; errors: Partial<Record<FieldName, string>> };

export interface ContactEnv {
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
}

export interface SendEmailArgs {
  apiKey: string;
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  text: string;
}

export type SendEmail = (
  args: SendEmailArgs,
) => Promise<{ ok: true } | { ok: false; error: string }>;
