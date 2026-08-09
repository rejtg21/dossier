"use client";

import { useId, useRef, useState } from "react";
import { LIMITS, validateSubmission } from "../../api/contact/_validate";
import type { FieldName } from "../../api/contact/_types";

type Status = "idle" | "submitting" | "success" | "error";

const FIELD_CLASSES =
  "w-full rounded-[4px] border border-line bg-transparent px-4 py-[12px] font-sans text-[15px] text-fg placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const LABEL_CLASSES =
  "mb-2 block font-mono text-[13px] tracking-[0.04em] text-muted uppercase";

/**
 * Posts to the Vercel Function at `/api/contact`.
 *
 * Validation is imported from `api/contact/_validate` rather than reimplemented
 * here, so the instant feedback a visitor sees and the rules the function
 * enforces cannot drift apart. The module is pure — no secrets, no Node APIs —
 * so shipping it to the browser costs nothing.
 */
export function ContactForm() {
  const formId = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const fieldId = (name: string) => `${formId}-${name}`;
  const errorId = (name: FieldName) => `${formId}-${name}-error`;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      company: String(data.get("company") ?? ""),
    };

    const check = validateSubmission(payload);
    if (!check.ok) {
      setErrors(check.errors);
      setStatus("idle");
      return;
    }

    setErrors({});
    setStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus("success");
        formRef.current?.reset();
        return;
      }

      const body = await response.json().catch(() => ({}));

      if (response.status === 400 && body.errors) {
        setErrors(body.errors);
        setStatus("idle");
        return;
      }

      setStatus("error");
    } catch {
      // Offline, DNS failure, request blocked — indistinguishable from here.
      setStatus("error");
    }
  }

  const describedBy = (name: FieldName) =>
    errors[name] ? errorId(name) : undefined;

  // Centred and capped below lg, where it sits under the intro; at lg it fills
  // its grid column instead.
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="mx-auto w-full max-w-[520px] text-left lg:max-w-none"
      aria-labelledby={`${formId}-legend`}
    >
      <h2 id={`${formId}-legend`} className="sr-only">
        Send a message
      </h2>

      <div className="flex flex-col gap-5">
        <div>
          <label className={LABEL_CLASSES} htmlFor={fieldId("name")}>
            Name
          </label>
          <input
            id={fieldId("name")}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={LIMITS.name}
            className={FIELD_CLASSES}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
          />
          {errors.name && (
            <p id={errorId("name")} className="mt-2 text-[14px] text-accent">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASSES} htmlFor={fieldId("email")}>
            Email
          </label>
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={LIMITS.email}
            className={FIELD_CLASSES}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
          />
          {errors.email && (
            <p id={errorId("email")} className="mt-2 text-[14px] text-accent">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASSES} htmlFor={fieldId("message")}>
            Message
          </label>
          <textarea
            id={fieldId("message")}
            name="message"
            rows={6}
            maxLength={LIMITS.message}
            className={`${FIELD_CLASSES} resize-y`}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy("message")}
          />
          {errors.message && (
            <p id={errorId("message")} className="mt-2 text-[14px] text-accent">
              {errors.message}
            </p>
          )}
        </div>

        {/* Honeypot: hidden from sighted users and from assistive tech, and
            skipped by Tab, so only a bot ever fills it. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor={fieldId("company")}>Company</label>
          <input
            id={fieldId("company")}
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-[4px] bg-accent px-4 py-[14px] font-mono text-[15px] font-medium text-canvas hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : "Send message"}
        </button>

        <p role="status" aria-live="polite" className="min-h-[1.5em] text-[15px]">
          {status === "success" && (
            <span className="text-fg">
              Thanks — your message is on its way. I&apos;ll reply soon.
            </span>
          )}
          {status === "error" && (
            <span className="text-accent">
              Something went wrong sending your message. Please email me
              directly.
            </span>
          )}
        </p>
      </div>
    </form>
  );
}
