# StallPass

The starter for the Week 9 revision challenge. Street traders at Warwick Junction, eThekwini, apply for a stall permit in three steps, uploading the documents their kind of stall needs. The market's permits officer searches traders and, when it comes to that, revokes a permit.

The brief (the rounds, the rules and the timings) is the PDF your instructor hands out. This file covers how to run the project and the API you'll be calling.

## Run it

You need Node 24, and **two terminals**.

```bash
npm ci
cp .env.example .env.local     # then fill in SESSION_SECRET (the file says how)
```

Terminal 1, the API:

```bash
npm run api                    # http://localhost:4200
```

Terminal 2, the app:

```bash
npm run dev                    # http://localhost:3000
```

If port 3000 is busy, stop Matric Compass or RondiTrack first.

Checks: `npm test` (Vitest), `npm run typecheck`, `npm run lint`, `npm run build`.

## Accounts

Every account's password is `StallPass-2026!`.

| Email | Role | Notes |
|---|---|---|
| `thandeka@stallpass.test` | trader | No applications yet: she's the one who applies |
| `sibusiso@stallpass.test` | trader | Holds permit P-1004 (trader T-01) |
| `ayanda@stallpass.test` | trader | Has one submitted application, A-2040 |
| `officer@stallpass.test` | permits officer | Searches traders, revokes permits |

## The API

A real HTTP server on port 4200, called by **your Next.js server**, never by the browser. It has no CORS headers, so a browser can't call it anyway. The contract is `openapi.json`, and `src/api/schema.d.ts` was generated from it with `npm run generate:api`.

**Read the contract before you code: it is not the same as Matric Compass.**

| Endpoint | Notes |
|---|---|
| `GET /api/v1/stall-types` | **Public.** Each type's fee (in cents) and the documents it needs, as `{ kind, label }`. |
| `POST /api/v1/auth/login`, `/refresh`, `/logout` | Both tokens in the JSON body, snake_case, as in WardWatch. Already wired up for you. |
| `GET /api/v1/me` | `{ id, name, email, role }`. `role` is `"trader"` or `"officer"`. |
| `GET /api/v1/applications` | The signed-in trader's applications. |
| `POST /api/v1/applications` | Body `{ stallTypeId, tradingName, tradingDays }`. 201, or 400 with an `errors` map. A trader has **one draft at a time**: a second is a 409 whose `applicationId` is the draft in progress. |
| `GET /api/v1/applications/{id}` | One application, with `requiredDocuments` and `documents`. 404 if it isn't yours. |
| `PUT /api/v1/applications/{id}` | Change a draft's details. 409 once submitted. |
| `POST /api/v1/applications/{id}/documents` | **multipart/form-data**, fields **`kind`** and **`file`**. PDF, JPEG or PNG, judged **by the file's bytes**, up to **2 MB**. 400 with `errors.file` or `errors.kind`. The same kind again replaces the one before. |
| `DELETE /api/v1/applications/{id}/documents/{documentId}` | 204. |
| `POST /api/v1/applications/{id}/submit` | 422 with `missing` (a list of `{ kind, label }`) while a document is missing; 409 if already submitted. |
| `GET /api/v1/traders?q=` | **Officers only**: a trader gets 403. Part of a name or permit number. Empty: everyone. **One character is a 400.** `{ items, total }`, at most 20 items. |
| `GET /api/v1/traders/{id}` | **Officers only.** The trader and their permit. |
| `GET /api/v1/permits/{permitNumber}/revocation-preview` | **Officers only.** What revoking would do: `bookingsCancelled`, `refundCents`, `lastTradingDay`. 409 if already revoked. |
| `POST /api/v1/permits/{permitNumber}/revoke` | **Officers only.** Body `{ reason }`, 10 to 300 characters: the trader is told it. 400 with `errors.reason`; 409 if already revoked. |

- **Access tokens last 5 minutes.** `proxy.ts` refreshes them for you.
- Dates are UTC instants; `formatWhen` shows them in South African time. Money is whole cents; `formatCents` shows rands.
- Every error is `application/problem+json`, with a `correlationId`.

## The control page

Open **http://localhost:4200** while the API runs. It shows every request the API received, newest first (a red row means a browser called it directly), and has buttons to:

- make the next document upload answer **500**;
- make the next revoke answer **500**;
- make **short searches slow** (2 or 3 characters take over a second, so an answer for "dl" can arrive after the answer for "dlamini");
- **revoke every session**;
- reset the data.

Restarting the API also resets the data and signs everyone out.

## What's here

| Path | What it is |
|---|---|
| `openapi.json`, `src/api/schema.d.ts`, `src/api/types.ts` | The contract, the generated types, and short names for them |
| `src/lib/session.ts`, `refresh.ts`, `api.ts`, `src/proxy.ts`, `src/app/actions/auth.ts`, `src/app/(auth)/login/` | Sign-in, the encrypted session and the refresh, as you built them in Week 8. Working. |
| `src/app/(app)/layout.tsx` | The signed-in layout: a sidebar with links by role, the person's name and Sign out |
| `src/app/page.tsx`, `src/lib/stallTypes.ts` | The public home page, from the cache |
| `src/app/(app)/applications/page.tsx` | A trader's applications |
| `src/app/(app)/apply/page.tsx`, `src/app/(app)/applications/DetailsForm.tsx`, `src/app/actions/applications.ts` | **Step 1 of an application, ready-made.** Saving it creates the draft and goes to `/applications/{id}?step=documents`, which you build. |
| `src/lib/applicationSteps.ts` | The steps, their labels, `loadStep` for the URL, and `resolveStep`, **which you write** |
| `src/app/(app)/traders/[id]/page.tsx` | A trader's page, ready-made. The revoke dialog is yours. |
| `src/components/Stepper.tsx` | The step list, with `aria-current="step"` |
| `src/components/ApplicationSummary.tsx` | Everything an application says, for Review and the submitted view |
| `src/components/TraderCard.tsx`, `PermitStatusBadge.tsx`, `CardSkeletons.tsx`, `ErrorView.tsx`, `Toaster.tsx` | Ready to use. The toaster is already on every page: `import { toast } from 'sonner'`. |
| `src/components/ui/` | shadcn: alert-dialog, badge, button, card, input, label, native-select, skeleton, textarea |
| `src/lib/days.ts`, `money.ts`, `dates.ts` | Trading days, `formatCents`, `formatWhen` |
| `vitest.config.mts`, `src/test/setup.ts`, `src/lib/money.test.ts` | Vitest, React Testing Library and jest-dom, configured. `npm test` runs the one example test. |
| `fake-api/` | The API. You don't need to read or change it. |
| `BUG-HUNT.md`, `PROGRESS.md` | You fill these in |

`next.config.ts` has `cacheComponents`, `partialPrefetching` and the React Compiler on, as Matric Compass does.

Installed and ready, at the same versions as Matric Compass: `jose`, `server-only`, `openapi-fetch`, `nuqs`, `sonner`, `zod`, Vitest 4.1.12, jsdom, React Testing Library, user-event and jest-dom. `@playwright/test` and `@axe-core/playwright` are installed for stretch goal C; their browser needs `npx playwright install chromium` (about 120 MB, so before class).
