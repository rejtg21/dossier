import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContactForm } from "./contact-form";

const fillIn = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const fillValid = () => {
  fillIn(/^name$/i, "Rej Mediodia");
  fillIn(/^email$/i, "someone@example.com");
  fillIn(/^message$/i, "I would like to talk about a project.");
};

const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => jsonResponse(200, { ok: true }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ContactForm", () => {
  it("posts the submission to the function endpoint", async () => {
    render(<ContactForm />);
    fillValid();
    submit();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/contact");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({
      name: "Rej Mediodia",
      email: "someone@example.com",
      message: "I would like to talk about a project.",
    });
  });

  it("reports success and clears the form", async () => {
    render(<ContactForm />);
    fillValid();
    submit();

    expect(await screen.findByText(/on its way/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^name$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^message$/i)).toHaveValue("");
  });

  it("blocks an invalid submission before it reaches the network", async () => {
    render(<ContactForm />);
    fillIn(/^name$/i, "Rej");
    fillIn(/^email$/i, "not-an-email");
    fillIn(/^message$/i, "I would like to talk about a project.");
    submit();

    expect(await screen.findByText(/does not look right/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("associates each error with its field for assistive tech", async () => {
    render(<ContactForm />);
    submit();

    const email = await screen.findByLabelText(/^email$/i);
    expect(email).toHaveAttribute("aria-invalid", "true");

    const describedBy = email.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(/email/i);
  });

  it("surfaces field errors returned by the server", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, { errors: { message: "Server said no." } }),
    );

    render(<ContactForm />);
    fillValid();
    submit();

    expect(await screen.findByText("Server said no.")).toBeInTheDocument();
  });

  it("shows a generic failure when the request rejects", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));

    render(<ContactForm />);
    fillValid();
    submit();

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("shows a generic failure on a 500", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { error: "nope" }));

    render(<ContactForm />);
    fillValid();
    submit();

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("announces status changes politely", async () => {
    render(<ContactForm />);
    fillValid();
    submit();

    const status = await screen.findByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    await waitFor(() => expect(status).toHaveTextContent(/on its way/i));
  });

  it("hides the honeypot from assistive tech and from Tab", () => {
    const { container } = render(<ContactForm />);

    const honeypot = container.querySelector('input[name="company"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    // The wrapper is aria-hidden, so a screen reader never reaches the input.
    expect(honeypot!.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("sends the honeypot value when a bot fills it", async () => {
    const { container } = render(<ContactForm />);
    fillValid();
    fireEvent.change(container.querySelector('input[name="company"]')!, {
      target: { value: "Acme Corp" },
    });
    submit();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());

    // The server decides what to do with it; the form only reports it.
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).company).toBe(
      "Acme Corp",
    );
  });
});
