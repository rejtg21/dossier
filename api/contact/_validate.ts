export type FieldName = "name" | "email" | "message";

export type ValidationResult =
  | {
      ok: true;
      value: {
        name: string;
        email: string;
        message: string;
        /** The honeypot was filled. Valid, but must not be delivered. */
        isSpam: boolean;
      };
    }
  | { ok: false; errors: Partial<Record<FieldName, string>> };

export const LIMITS = {
  name: 100,
  email: 254,
  message: 5000,
  messageMin: 10,
} as const;

/**
 * Deliberately permissive. The only real authority on whether an address exists
 * is whether delivery succeeds, so this rejects obvious typos rather than
 * trying to encode RFC 5322 — a stricter pattern mostly rejects valid addresses.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const asString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

/**
 * Validates a parsed JSON body from the wire, so every field is `unknown` until
 * proven otherwise — a client can post anything, including nothing.
 *
 * Kept in its own module because the browser form imports it too: the instant
 * feedback a visitor sees and the rules the function enforces are the same code
 * and cannot drift. It is pure — no secrets, no Node APIs — so shipping it to
 * the browser costs nothing.
 *
 * The `company` field is a honeypot: hidden from sighted users and from
 * assistive tech, so a human never fills it. Bots fill every input they find.
 * A filled honeypot is reported as `isSpam` rather than as a validation error,
 * because telling a bot why it failed just teaches it to pass.
 */
export function validateSubmission(input: unknown): ValidationResult {
  const body = (input ?? {}) as Record<string, unknown>;

  const name = asString(body.name);
  const email = asString(body.email);
  const message = asString(body.message);
  const company = asString(body.company);

  const errors: Partial<Record<FieldName, string>> = {};

  if (!name) {
    errors.name = "Please tell me your name.";
  } else if (name.length > LIMITS.name) {
    errors.name = `Please keep your name under ${LIMITS.name} characters.`;
  }

  if (!email) {
    errors.email = "Please add an email so I can reply.";
  } else if (email.length > LIMITS.email || !EMAIL_SHAPE.test(email)) {
    errors.email = "That email address does not look right.";
  }

  if (!message) {
    errors.message = "Please add a message.";
  } else if (message.length < LIMITS.messageMin) {
    errors.message = `Please write at least ${LIMITS.messageMin} characters.`;
  } else if (message.length > LIMITS.message) {
    errors.message = `Please keep your message under ${LIMITS.message} characters.`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { name, email, message, isSpam: company.length > 0 },
  };
}
