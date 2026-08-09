# dossier

Rej Mediodia's portfolio — a statically exported Next.js site with a contact
form backed by a Vercel Function.

The six content pages are prerendered to plain HTML at build time; there is no
server rendering and no runtime data fetching. The only server-side code is the
contact endpoint, which is a Vercel Function rather than a Next.js route,
because `output: "export"` forbids Route Handlers and Server Actions.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Vitest · Playwright · Nodemailer.

## Requirements

- Node.js 22 or newer
- The [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`) to run or
  deploy the API

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next dev server on :3000. **Does not serve `/api`** — see below. |
| `npm run build` | Static export to `out/`. |
| `npm start` | Serves the built `out/` directory. Not `next start`, which does not work under `output: "export"`. |
| `npm run lint` | ESLint. |
| `npm test` | Vitest once — unit and component tests. |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run test:e2e` | Playwright. Builds and serves `out/` on :3100 automatically; no server needed beforehand. |
| `vercel dev` | The whole thing, including `/api`. Use this for the contact form. |

`npm run dev` serves only the Next app, so `POST /api/contact` returns 404 there.
That is expected: the endpoint lives in the root `api/` directory, which Next
knows nothing about. Use `vercel dev` when you need it.

First-time Playwright setup on a machine: `npx playwright install`.

## Layout

```
src/app/          one directory per route: /, expertise, projects,
                  leadership, philosophy, contact
src/components/   presentational; only site-nav and contact-form are client
                  components, everything else renders on the server
src/data/         all page content as typed modules
api/contact/      POST /api/contact — validation and delivery
api/queues/       the email sender, and the queue consumer (currently inactive)
api/services/     blob storage, the event bus, the queue client
api/listeners/    catch-contacts, which archives failed submissions
e2e/              Playwright specs, grouped by area
```

Everything under `api/` is prefixed `_` except the endpoints themselves. That is
load-bearing: Vercel turns **every** file in `api/` into a public endpoint unless
its name starts with `_` or `.`, so without the prefix `_validate.test.ts` would
be live at `/api/contact/validate.test`. Only `api/contact/index.ts` may lack it.

## Contact form

A submission is validated, then emailed via Gmail SMTP using an app password.
Delivery is **synchronous** on this branch — Vercel Queues requires a Pro plan,
so the queue consumer is retained but inactive. See the header of
`api/queues/_send-contact-email.ts` for the three steps to switch back.

If the send fails, the submission is archived to Vercel Blob so it is never
lost, and the visitor is still shown success — their message did reach a human.
Only a failure that could not be archived reports an error.

Validation lives in `api/contact/_validate.ts` and is imported by both the
function and the browser form, so client-side feedback cannot drift from what
the server enforces.

### Environment variables

Set these in the Vercel dashboard, then `vercel env pull` for local work.

| Variable | Required | Notes |
| --- | --- | --- |
| `GMAIL_USER` | yes | The Gmail address that authenticates. Gmail forces it to be the sender; the visitor's address goes in reply-to. |
| `GMAIL_APP_PASSWORD` | yes | 16-character [app password](https://myaccount.google.com/apppasswords), not the account password. Needs 2-Step Verification. Paste it without spaces. |
| `CONTACT_TO_EMAIL` | yes | Where submissions are delivered. |
| `CONTACTS_BLOB_PATHNAME` | no | Archive filename, default `contacts.json`. Point preview at a different one so it cannot write into the production archive. |
| `BLOB_READ_WRITE_TOKEN` | yes | Injected automatically once a Blob store is connected — do not set it by hand. |

A Blob store must exist for the archive to work: `vercel blob create-store contacts`.
Without one, a failed send is lost rather than kept.

Gmail caps sending at roughly 500/day on a free account, 2,000 on Workspace.

## Testing

Unit and component tests sit next to the code they cover; e2e specs live in
`e2e/`. The split follows one rule — put a check at the lowest layer that can
hold it, and reserve Playwright for what jsdom structurally cannot see: layout,
reachability, real navigation, and whether an element is genuinely interactive.

A new test should fail before it passes. Break the thing it guards, watch it go
red, then restore.

## Deployment

Pushed to Vercel. The build produces `out/`; the `api/` directory is deployed as
functions alongside it. Environment variables only apply to new deployments, so
redeploy after changing them.
