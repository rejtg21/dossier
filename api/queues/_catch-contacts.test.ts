// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { registerCatchContacts, resetCatchContacts } from "./_catch-contacts";
import { removeFailure, saveFailure } from "./_contacts-store";
import { emit, resetListeners } from "./_events";

vi.mock("./_contacts-store", () => ({
  saveFailure: vi.fn(),
  removeFailure: vi.fn(),
}));

const save = vi.mocked(saveFailure);
const remove = vi.mocked(removeFailure);

const submission = {
  name: "Rej Mediodia",
  email: "someone@example.com",
  message: "I would like to talk about a project.",
};

const failure = {
  messageId: "msg_1",
  deliveryCount: 3,
  error: "535 auth rejected",
  submission,
};

beforeEach(() => {
  resetListeners();
  resetCatchContacts();
  registerCatchContacts();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("catch-contacts", () => {
  it("stores the submission when email-failed is emitted", async () => {
    await emit("email-failed", failure);

    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0]).toMatchObject({
      messageId: "msg_1",
      attempts: 3,
      error: "535 auth rejected",
      submission,
    });
  });

  it("stamps when the failure happened", async () => {
    await emit("email-failed", failure);

    expect(save.mock.calls[0][0].failedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/,
    );
  });

  it("removes the record when email-sent is emitted", async () => {
    await emit("email-sent", { messageId: "msg_1" });

    expect(remove).toHaveBeenCalledWith("msg_1");
    expect(save).not.toHaveBeenCalled();
  });

  it("registers only once, so a warm instance does not double-write", async () => {
    registerCatchContacts();
    registerCatchContacts();

    await emit("email-failed", failure);

    expect(save).toHaveBeenCalledOnce();
  });

  it("waits for the store before resolving", async () => {
    let settled = false;
    save.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      settled = true;
    });

    await emit("email-failed", failure);

    // If emit did not await listeners, the message could be acknowledged
    // before the submission was ever written down.
    expect(settled).toBe(true);
  });

  it("surfaces a store failure to the emitter", async () => {
    save.mockRejectedValue(new Error("blob unavailable"));

    await expect(emit("email-failed", failure)).rejects.toThrow(
      "blob unavailable",
    );
  });
});
