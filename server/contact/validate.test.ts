import { describe, expect, it } from "vitest";

import { LIMITS, validateSubmission } from "./validate";

const valid = {
  name: "Rej Mediodia",
  email: "someone@example.com",
  message: "I would like to talk about a project.",
};

describe("validateSubmission", () => {
  it("accepts a complete submission and trims each field", () => {
    const result = validateSubmission({
      name: "  Rej  ",
      email: "  someone@example.com  ",
      message: "  I would like to talk about a project.  ",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        name: "Rej",
        email: "someone@example.com",
        message: "I would like to talk about a project.",
        isSpam: false,
      },
    });
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "not an object"],
    ["an empty object", {}],
  ])("rejects %s without throwing", (_label, input) => {
    const result = validateSubmission(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        "email",
        "message",
        "name",
      ]);
    }
  });

  it("rejects non-string field types rather than coercing them", () => {
    const result = validateSubmission({ ...valid, name: 42 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.name).toBeDefined();
  });

  it.each([
    "no-at-sign",
    "missing@domain",
    "spaces in@example.com",
    "@example.com",
  ])("rejects %s as an email", (email) => {
    const result = validateSubmission({ ...valid, email });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.email).toBeDefined();
  });

  it("rejects a message shorter than the minimum", () => {
    const result = validateSubmission({ ...valid, message: "hi" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.message).toContain(String(LIMITS.messageMin));
    }
  });

  it.each([
    ["name", "a".repeat(LIMITS.name + 1)],
    ["message", "a".repeat(LIMITS.message + 1)],
  ])("rejects an over-long %s", (field, value) => {
    const result = validateSubmission({ ...valid, [field]: value });

    expect(result.ok).toBe(false);
  });

  it("accepts values exactly at the limit", () => {
    const result = validateSubmission({
      ...valid,
      name: "a".repeat(LIMITS.name),
      message: "a".repeat(LIMITS.message),
    });

    expect(result.ok).toBe(true);
  });

  describe("honeypot", () => {
    it("flags a filled honeypot as spam without reporting an error", () => {
      const result = validateSubmission({ ...valid, company: "Acme Corp" });

      // Valid *and* spam: telling a bot why it failed teaches it to pass.
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.isSpam).toBe(true);
    });

    it("does not flag whitespace-only as spam", () => {
      const result = validateSubmission({ ...valid, company: "   " });

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.isSpam).toBe(false);
    });
  });
});
