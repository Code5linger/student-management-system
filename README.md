# Student Management System - Registry Module

A focused implementation of the four workflows a Registry Administrator uses daily: **Enrolment**, **Fees & Payments**, **Assessment Submission**, and **Marksheet & Results**.

Built with Next.js 16 (App Router, Turbopack), Tailwind CSS 4 with a partial shadcn/ui migration, PostgreSQL, Prisma ORM 7, Zod validation, and Vitest for unit tests. Optionally runs in Docker.

---

## Running it locally

### 1. Prerequisites

- Node.js **20.9+** (Next.js 16's minimum; Prisma 7 wants 20.19+, so 22 LTS is the safe choice)
- A PostgreSQL database (local install, or a free hosted instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com) - either is faster than installing Postgres locally)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your environment

Copy the example file and fill in your own database connection string:

```bash
cp .env.example .env
```

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sms_registry"
```

### 4. Set up the database

```bash
npx prisma generate   # generates the Prisma Client (into src/generated/prisma - see note below)
npx prisma db push    # creates the tables from schema.prisma
npm run db:seed       # loads demo data (5 students, 2 programmes, payments, grades)
```

### Running tests

```bash
npm test         # runs once
npm run test:watch
```

39 tests, covering the pure business logic (`src/lib/registry.ts`) and Zod
validation schemas (`src/lib/validation.ts`) - balance math, overdue/late
boundaries, grade classification, and a couple of deliberately-tricky Zod
cases (e.g. a boolean schema correctly rejecting the string `"false"`
rather than coercing it to `true`). These do **not** cover the payment
transaction's concurrency behavior or the published-grade edit rule, since
both need a real Postgres connection to exercise meaningfully - see
`docs/product-decisions.md` for that gap spelled out.

### Running with Docker (alternative to steps 1-5 above)

```bash
docker compose up --build
# in another terminal, once it's up:
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed
```

This has **not** been built/run in the environment that wrote it (no Docker
daemon was available there) - see `docs/ai-usage.md` for exactly what was
and wasn't verified. Treat the first `docker compose up` as a real test.

> **Note on Prisma 7**: this project pins `prisma`/`@prisma/client` to `^7.10.0`, the current stable line - running `npm install prisma@latest` will actually pull `8.0.0-rc.x`, a beta "unified CLI" package with some known-vulnerable bundled tooling. Don't upgrade past 7.x here without checking Prisma 8's status first.
>
> Also: Prisma 7 requires a **driver adapter** (`@prisma/adapter-pg`, already included) rather than its old built-in query engine, and the CLI no longer auto-loads `.env` - both are already wired up in `src/lib/prisma.ts` and `prisma.config.ts`, nothing extra to configure.

### 5. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`. There's no real authentication - the landing page lets you enter as **Staff** or pick a **Student** to view their record as.

> **This project was recently migrated to Next.js 16 / Tailwind CSS 4 / Prisma ORM 7.** The migration was done carefully - every changed file was grepped for stale patterns, the whole codebase was typechecked, and both the Tailwind v4 build and the exact dependency tree were actually executed and inspected - but it has **not** been run end-to-end against a live database or in a browser yet. If `npm run dev` doesn't come up cleanly, that's the most likely place to look first; please report back what you see.

---

## Environment variables

| Variable       | Description                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string. Include `?sslmode=require` if your host (Neon/Supabase) requires it. |

No other secrets are required - there's no third-party API, auth provider, or file storage service wired up (see design decisions below).

---

## Design decisions worth knowing about

The brief deliberately leaves some things open. The full reasoning for every
decision below (and several more) lives in `docs/product-decisions.md`, with
a companion `docs/edge-cases.md` listing exactly how each edge case is
handled. Highlights:

- **What makes a fee "overdue"?** There's no due date anywhere in the brief, so I added `feeDueDate` on `Student`, defaulted to 30 days after enrolment and editable per student. A student is overdue when `feeDueDate` has passed **and** their balance is still above zero. Withdrawn/deferred students are still included - they may still owe money, and a real Registry office keeps chasing that.
- **Fees are snapshotted, not live.** `Student.assignedFee` is captured from the programme's fee at enrolment (staff can override it), rather than balances being computed against the programme's _current_ fee. Otherwise, raising a programme's price would retroactively change what already-enrolled students owe. The seed data demonstrates this directly.
- **Outstanding balance** is always computed as `assignedFee − sum(payments)`, never stored as a flag, so partial payments work correctly. **Overpayments are rejected** (409) rather than modeled as credit, since the brief doesn't define refund/credit handling - and payment recording runs inside a `SERIALIZABLE` transaction so two simultaneous payments against the same student can't jointly overdraw the account.
- **Student ID** (`SMS-2026-0001`) uses the enrolment year, but the sequence itself is a single global counter that never resets and is generated by an atomic `INSERT ... ON CONFLICT ... RETURNING` against a dedicated counter row - not by counting existing students, which had a real race condition under concurrent enrolments in an earlier version of this build.
- **Resubmission** is only allowed before an assessment's deadline. A first-time submission after the deadline is still accepted (and flagged late), but once the deadline passes, an existing submission can no longer be replaced.
- **Grades require a submission**, and **"not graded," "withheld," and "published" are three distinct states** - no `Grade` row, a `Grade` with `publishedAt: null`, and a `Grade` with a timestamp, respectively. Staff can always see a grade; the marksheet query filters `publishedAt: { not: null }` server-side, so there's no code path that could leak an unpublished result. **Published grades are also protected from silent edits** - changing the score of an already-published grade is rejected unless it's withheld first (this caught a real bug: an earlier "Save" button silently unpublished on every edit).
- **File storage** is the local filesystem (`/public/uploads`), not S3 or similar, with extension + MIME type + a 10MB size cap enforced on upload. Fine for this scope, but note that most serverless hosts (Vercel included) don't persist local disk writes across deployments/instances - a production version would swap this for object storage. The abstraction is isolated in `src/lib/storage.ts` so swapping it out later is a one-file change.
- **Role separation and route protection.** The landing page sets a plain cookie (`sms_role`, plus `sms_student_id` for students) via a server action - there's still no real login, per the brief's "auth optional" allowance. But every `/staff/*` and `/student/[id]` route is gated by middleware (redirects unauthorized visits before the page even renders), **and** every mutating API route independently checks the same session server-side (`src/lib/api-guard.ts`), so a student can't view staff pages, can't view another student's record, and can't hit `POST /api/students` or `/api/submissions/.../grade` directly even by bypassing the UI. This is still not real security - the cookie is unsigned and a technically inclined user could set it themselves in devtools - but it closes the gap between "no login" and "no access control at all," which the initial version had.

See `docs/product-decisions.md` → **"What we deliberately did not build"**
for an explicit list of reasonable-sounding features (decimal grades, a
currency field, submission attempt history, audit user-tracking, URL-synced
filters, bulk publish) that were considered and consciously left out, not
just forgotten.

---

## How AI was used

I used Claude (Sonnet) throughout this build, working interactively rather than accepting a single generated dump. Roughly:

- **Architecture & schema**: I asked for a first-pass Prisma schema covering all four modules, then reviewed it against how a real Registry office actually operates. I pushed back on and changed a few things it initially proposed - notably, an early version stored `feeStatus` as an enum flag (Paid/Unpaid) rather than computing balance from payments, which would have broken partial payments. I also added the `feeDueDate` field myself since the AI's first draft didn't flag that "overdue" was undefined in the brief until asked directly.
- **API routes and UI**: generated route-by-route with the schema as context, then read through each one for correctness - e.g., I caught that the first version of the submission route allowed resubmission after the deadline (it only checked "does a submission exist," not the deadline itself), and had it corrected to match the brief's actual wording ("resubmission before the deadline").
- **Client/server boundaries**: the assistant's first draft put the Prisma-dependent `generateStudentId` helper in the same file as pure functions I needed in a client component, which would have broken the build (bundling Prisma into browser code). This was caught and split into a separate server-only file.
- **What I did not do**: blindly ship the output. I read every file, understand the data model and why each relation exists, and can walk through any part of this in a follow-up conversation or interview.
- **Second pass, from my own testing**: after getting this running, I noticed a student could visit staff-only URLs directly (e.g. `/staff/assessments/<id>`) since nothing actually checked who was "logged in" as what - the role toggle only ever controlled which link you clicked, not what you could load afterward. I asked the assistant to add real route/API guards rather than patching the one URL, which is why the session/middleware/api-guard layer exists. The same pass added consistent error handling (proper 404s for missing records, 403s for cross-role access, validation on enum/date fields) that the first draft was inconsistent about.
- **Third pass, evaluating external AI advice**: I separately asked other AI assistants for a general critique of this assessment and got back extensive, generic recommendations (architecture options, a large decision checklist, suggested doc structure). I didn't implement it wholesale - I evaluated each suggestion against what was already built and adopted the ones with real justification (fee snapshotting, an atomic Student ID counter, overpayment rejection with a concurrency-safe transaction, published-grade edit protection) while explicitly rejecting others as scope creep (decimal grades, a currency field, submission version history, audit user-tracking). See `docs/ai-usage.md` for the specific reasoning, and `docs/product-decisions.md`'s "What we deliberately did not build" section.
- **Fourth pass, upgrading the stack**: moved Next.js 14→16, Tailwind 3→4, and Prisma 5→7 (React came along as a transitive requirement, 18→19). This is where I most valued having the assistant actually _run_ things rather than pattern-match from training data - it caught three real problems that pure code review wouldn't have: (1) `npm install prisma@latest` silently resolves to `8.0.0-rc.x`, a beta package with known-vulnerable bundled tooling, not the stable release - pinned to `^7.10.0` instead; (2) Prisma 7 moved `Decimal`'s export path, which would have been a runtime import error, not a type error, so it wouldn't have shown up until someone actually ran the code; (3) Tailwind v4's `@apply` can't chain custom component classes the way v3 could, which the CSS compiler caught immediately when actually invoked but a visual diff or code read wouldn't have. All three were verified by actually executing the relevant tool (`npm ls`, a direct Node import, and the real Tailwind CLI), not inferred.

I have not yet run this specific migrated version against a live database or in a real browser - see the AI-usage doc for exactly what was and wasn't verified. That's the next thing I'm doing before considering this final. [Update this line honestly based on your own testing before you submit.]

---

## Project structure

```
next.config.mjs / postcss.config.mjs - build config (ESM; see package.json's "type": "module")
prisma.config.ts     - Prisma 7's CLI config (DB URL, migrations path, seed command)
components.json      - shadcn/ui config (style, aliases, theme mode)
Dockerfile / docker-compose.yml / .dockerignore - containerized setup (unverified, see above)
vitest.config.ts     - test runner config
docs/
  product-decisions.md - full reasoning behind every non-obvious decision
  edge-cases.md         - scannable table of edge cases and how each is handled
  ai-usage.md           - how AI-generated advice about the assessment itself was evaluated
prisma/
  schema.prisma       - data model
  seed.ts             - demo data
src/
  proxy.ts              - route guard: redirects unauthorized /staff and /student visits (Next.js 16 renamed middleware.ts → proxy.ts)
  app/
    page.tsx            - role picker (landing page)
    actions.ts          - server actions that set/clear the session cookie
    error.tsx / not-found.tsx - global error and 404 pages
    staff/              - staff-facing pages (dashboard, students, assessments)
    student/[id]/       - student-facing pages (record, assessments, marksheet)
    api/                - route handlers (students, programmes, payments, assessments, submissions, grades, dashboard)
  components/           - shared badge components (now built on src/components/ui/badge.tsx)
  components/ui/        - hand-authored shadcn/ui primitives (button, input, label, card, badge, table, select)
  lib/
    prisma.ts           - Prisma Client singleton
    session.ts          - reads the role cookie into a typed Session
    api-guard.ts         - requireStaff()/requireStudent() checks + shared error handling, used in every API route
    validation.ts         - Zod schemas for every API route's request body
    utils.ts              - cn() className-merging helper (shadcn convention)
    registry.ts          - pure business logic (balance, overdue, classification, validation helpers, business-rule errors) - safe for client components; also has registry.test.ts alongside it
    registry.server.ts   - Prisma-dependent helpers (atomic Student ID generation) - server-only
    storage.ts           - local file storage for submissions, with size/type validation
```

## What I'd do next with more time

- Finish the shadcn/ui migration - only `badges.tsx` and `new-student-form.tsx` are actually migrated; the rest of the forms and tables still use the pre-migration custom Tailwind classes (see `docs/product-decisions.md` for the exact list).
- Integration tests for the payment transaction's concurrency behavior and the published-grade edit rule, both of which need a real Postgres connection to exercise (unit tests can't reach them).
- Actually build and run the Docker setup - it's never been executed, only reasoned through.
- Real authentication (signed sessions, actual login) - the current cookie-based guard stops casual access but isn't cryptographically trustworthy.
- Move file storage to S3/Vercel Blob.
- URL-synced filters and pagination state on the students list, so a filtered view is shareable/bookmarkable (currently held in React state only).
- Prisma migrations (`prisma migrate dev`) committed to the repo instead of relying on `db push` for schema changes going forward.
- Bulk grade publication, if staff feedback suggests one-at-a-time is too slow in practice.

### Known Issue: Browser Console Web Vitals Error

In some development and production browser sessions, the console may display the following error:

```text
Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
at et.reportAllChanges
```

This originates from Web Vitals/INP instrumentation rather than application code. The stack trace points to dynamically executed `VM*.js` code and does not reference any application source files. The issue was reproduced locally as well as on the deployed Vercel environment.

It does not affect the application's functionality, database operations, authentication, assessment workflow, submissions, grading, or marksheet functionality.

This has therefore been documented as a known tooling/instrumentation issue rather than suppressing the error globally or modifying application error handling.
