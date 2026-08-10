# dossier

A portfolio site built on a static site generation (SSG) architecture, with a
Vercel Function for the one part that needs a server.

Every content page is prerendered to plain HTML at build time — no server
rendering, no runtime data fetching. The contact endpoint is a Vercel Function
rather than a Next.js route, because `output: "export"` forbids Route Handlers
and Server Actions.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Vitest · Playwright · Nodemailer.

## Requirements

- Node.js 22 or newer
- The [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`) to run or
  deploy the API

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | `vercel dev` on :3000 — the site *and* `/api`. Needs the Vercel CLI and a linked project. |
| `npm run build` | Static export to `out/`. |
| `npm start` | Serves the built `out/` directory. Not `next start`, which does not work under `output: "export"`. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | Generates Next's route types, then `tsc --noEmit`. The typegen step matters: `LayoutProps` and friends live in `.next`, so a bare `tsc` fails in a fresh checkout. |
| `npm test` | Vitest once — everything under `src/` and `api/`. |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run test:api` | Vitest against `api/` only — the endpoint, validation, delivery, and the Blob archive. |
| `npm run test:e2e` | Playwright. Builds and serves `out/` on :3100 automatically; no server needed beforehand. |

A plain `next dev` would serve only the Next app: the endpoint lives in the root
`api/` directory, which Next knows nothing about, so `POST /api/contact` would
404. That is why `npm run dev` runs `vercel dev` instead.

First-time Playwright setup on a machine: `npx playwright install`.

## Testing the API

`npm run test:api` covers it without a server. The specs import the handler and
call `handler.fetch()` with a real `Request`, mocking only the boundaries —
Nodemailer and Blob — so validation, the three response codes, and the archive
fallback are all asserted directly. The `// @vitest-environment node` line at the
top of every spec that touches a `Request`, a `Response`, or Node's crypto is
load-bearing: the default jsdom environment does not provide them.

Playwright does not reach `/api`. The suite serves the static export, which has
no functions in it, and `e2e/pages/contact/contact-form.spec.ts` stubs the
endpoint at the network layer rather than calling the real one.

To exercise it end to end, run `npm run dev` and post to it — with the three
Gmail variables from `.env.example` set in `.env.local`, or a send will fail:

```bash
curl -i -X POST http://localhost:3000/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"you@example.com","message":"Hello from curl."}'
```

`200` means it was sent, or that a failed send was archived to Blob — both mean
the message reached a human. `400` is a validation failure, and `502` is the one
case worth acting on: not sent and not archived.

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

A submission is validated, then emailed via Gmail SMTP. Delivery is
**synchronous** on this branch — Vercel Queues requires a Pro plan, so the queue
consumer is retained but inactive. See the header of
`api/queues/_send-contact-email.ts` for the three steps to switch back.

If the send fails, the submission is archived to Vercel Blob so it is never
lost, and the visitor is still shown success — their message did reach a human.
Only a failure that could not be archived reports an error.

Validation lives in `api/contact/_validate.ts` and is imported by both the
function and the browser form, so client-side feedback cannot drift from what
the server enforces.

## Testing

Unit and component tests sit next to the code they cover; e2e specs live in
`e2e/`. The split follows one rule — put a check at the lowest layer that can
hold it, and reserve Playwright for what jsdom structurally cannot see: layout,
reachability, real navigation, and whether an element is genuinely interactive.

A new test should fail before it passes. Break the thing it guards, watch it go
red, then restore.

## Deployment

Deployed on Vercel. The build produces `out/`, and the `api/` directory is
deployed as functions alongside it.
