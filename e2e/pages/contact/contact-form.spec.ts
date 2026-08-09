import { expect, test, type Page } from "@playwright/test";

/**
 * The contact form against the real static export.
 *
 * `/api/contact` is a Vercel Function and does not exist in `out/`, so every
 * spec here stubs it. That is the right boundary anyway: the function's own
 * behaviour is covered by `server/contact/*.test.ts` against its real logic,
 * and asserting against a live third-party mailer would test Resend, not this
 * site.
 *
 * What only a browser can prove is on this side of the wire — that the form is
 * operable by keyboard, that the honeypot is genuinely unreachable, and that
 * the request actually leaves the page with the right shape.
 */
const stub = (page: Page, status: number, body: unknown) =>
  page.route("**/api/contact", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    }),
  );

const fillValid = async (page: Page) => {
  await page.getByLabel(/^name$/i).fill("Rej Mediodia");
  await page.getByLabel(/^email$/i).fill("someone@example.com");
  await page
    .getByLabel(/^message$/i)
    .fill("I would like to talk about a project.");
};

const sendButton = (page: Page) =>
  page.getByRole("button", { name: /send message/i });

test.describe("contact form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("posts the submission as JSON to the function", async ({ page }) => {
    await stub(page, 200, { ok: true });

    const request = page.waitForRequest("**/api/contact");
    await fillValid(page);
    await sendButton(page).click();

    const posted = await request;
    expect(posted.method()).toBe("POST");
    expect(posted.postDataJSON()).toMatchObject({
      name: "Rej Mediodia",
      email: "someone@example.com",
      message: "I would like to talk about a project.",
    });
  });

  test("confirms success to the visitor", async ({ page }) => {
    await stub(page, 200, { ok: true });

    await fillValid(page);
    await sendButton(page).click();

    await expect(page.getByRole("status")).toContainText(/on its way/i);
    await expect(page.getByLabel(/^name$/i)).toHaveValue("");
  });

  test("shows the server's field error", async ({ page }) => {
    await stub(page, 400, { errors: { message: "Please write more." } });

    await fillValid(page);
    await sendButton(page).click();

    await expect(page.getByText("Please write more.")).toBeVisible();
  });

  test("shows a generic failure when the function errors", async ({ page }) => {
    await stub(page, 500, { error: "boom" });

    await fillValid(page);
    await sendButton(page).click();

    await expect(page.getByRole("status")).toContainText(/something went wrong/i);
  });

  test("validates in the browser before sending", async ({ page }) => {
    let called = false;
    await page.route("**/api/contact", (route) => {
      called = true;
      return route.fulfill({ status: 200, body: "{}" });
    });

    await page.getByLabel(/^email$/i).fill("not-an-email");
    await sendButton(page).click();

    await expect(page.getByText(/does not look right/i)).toBeVisible();
    expect(called, "no request should have been made").toBe(false);
  });

  test("is operable by keyboard, and Tab never reaches the honeypot", async ({
    page,
  }) => {
    await stub(page, 200, { ok: true });

    await page.getByLabel(/^name$/i).focus();
    await page.keyboard.type("Rej Mediodia");
    await page.keyboard.press("Tab");
    await page.keyboard.type("someone@example.com");
    await page.keyboard.press("Tab");
    await page.keyboard.type("I would like to talk about a project.");

    // The honeypot sits between the message field and the button in the DOM.
    // If it were focusable, this Tab would land on it instead of the button.
    await page.keyboard.press("Tab");

    const focusedName = await page.evaluate(
      () => document.activeElement?.getAttribute("name") ?? "",
    );
    expect(focusedName).not.toBe("company");

    await expect(sendButton(page)).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toContainText(/on its way/i);
  });
});
