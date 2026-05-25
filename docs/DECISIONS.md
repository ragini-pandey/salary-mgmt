# Architecture Decisions

This file captures the non-obvious engineering decisions for the salary
management tool. Each entry lists the choice, alternatives considered,
and why we picked what we picked.

---

## ADR-001: Next.js full-stack over split frontend/backend

**Decision.** Use Next.js 16 App Router for both the UI and the API
(via Route Handlers under `src/app/api/...`).

**Alternatives considered.**
- Node + Express + a separate React SPA.
- Python + FastAPI behind React.

**Why.**
- The brief calls for a single deployed product. One Next.js app
  collapses build, deploy, and routing into a single Vercel target —
  fewer moving parts for the reviewer to set up.
- Shared TypeScript types across the API boundary remove a whole class
  of contract bugs without resorting to a code-gen step.
- The Node ecosystem has first-class drivers for both production
  Postgres (`pg`) and in-process Postgres for tests (`@electric-sql/pglite`),
  which is the linchpin of the test strategy below.

**Trade-off.** We pay the App Router learning curve and lose some of the
clean layering a separate API would force. We compensate by keeping a
strict directory boundary: `app/api/...` only does HTTP plumbing;
business logic lives in `lib/services/` and `lib/repositories/`.

---

## ADR-002: PostgreSQL via `pg` driver, with pglite for tests

**Decision.**
- Production / dev runtime: PostgreSQL (Neon for deploy, docker-compose
  for local).
- Test runtime: `@electric-sql/pglite` — a WASM build of Postgres that
  runs in-process.

**Alternatives considered.**
- SQLite (allowed by the brief). Rejected because SQL dialect differs
  from Postgres and we lose features like proper numeric types.
- Mock the database in service tests. Rejected because the bulk of the
  logic we care about *is* SQL (aggregates, sorts, filters); mocked tests
  would be theatre.
- Testcontainers + real Postgres in Docker. Rejected for the brief's
  "fast, deterministic, easy to understand" tests bar — Docker spinup
  per CI run costs seconds we don't need to pay.

**Why pglite.** Real Postgres semantics, in-process, no Docker, fresh
DB per test in milliseconds. This is the single most consequential
choice in the test strategy.

---

## ADR-003: Drizzle ORM over Prisma

**Decision.** Drizzle ORM for the data layer.

**Alternatives considered.**
- Prisma. Industry standard, great DX.
- Raw `pg` queries. No abstraction tax.

**Why Drizzle.**
- The brief calls out performance of the seed script. Drizzle compiles
  to one statement; Prisma's `createMany` is fine, but Drizzle gives us
  finer-grained control over batched inserts and `COPY`-like paths if we
  need them.
- Drizzle's schema-first model produces TypeScript types directly from
  the schema, with no codegen step.
- Drizzle plays cleanly with pglite via its own adapter, which is
  exactly the test path we chose in ADR-002.

**Trade-off.** Less mature ecosystem than Prisma, fewer Stack Overflow
answers. We mitigate by keeping repository code small and explicit.

---

## ADR-004: Salaries stored as integer minor units in local currency

**Decision.** The `salary` column is a non-negative integer representing
the *annual* salary in the *minor unit* of the employee's local currency
(e.g. cents for USD, paise for INR). Currency code is stored alongside.

**Alternatives considered.**
- `NUMERIC(12, 2)` decimal.
- Float. (Hard pass — floating-point money is a footgun.)

**Why integers.**
- No rounding drift across aggregates. `AVG(salary)` over 10K rows
  produces an exact mean.
- JS `number` represents integers up to 2^53 exactly — comfortably
  larger than any plausible salary in minor units.
- Display formatting becomes the UI's job, which is the right place
  for it.

**Insights scoping.** Min/max/avg are reported *per country*, which
sidesteps cross-currency aggregation. A future cross-country view
would require FX normalization; out of scope for this iteration.

---

## ADR-005: TDD with red→green→refactor commits

**Decision.** Every behavior change lands in three (or two) commits:
1. `test: …` — failing test describing the behavior.
2. `feat: …` — minimal implementation that makes it pass.
3. (When applicable) `refactor: …` — cleanup with green tests.

**Why.** Two reasons specific to this assessment:
1. The reviewers asked for incremental commits that show how the
   solution evolved. Red/green pairs literally show the "what" before
   the "how".
2. The test suite ends up driving the API design rather than chasing
   it. Repositories and services that are awkward to test get
   refactored before they accrue more callers.

---

## ADR-006: Component library — shadcn/ui

**Decision.** Use shadcn/ui (Radix + Tailwind) for UI primitives.

**Alternatives considered.** MUI, Ant Design, Chakra UI.

**Why.**
- Components are copied into the repo rather than installed as a black
  box. We own them; we can audit and modify them.
- Built on Radix, which gives us accessibility primitives by default.
- Pairs natively with the Tailwind setup that's already in the
  scaffold.

---

## ADR-007: Server Components for read paths, Client Components for forms

**Decision.** The employee list and the insights dashboard are React
Server Components — they fetch data on the server, render on the
server, and stream HTML. Forms and interactive widgets (search box,
country dropdown, dialogs) are Client Components.

**Why.** RSCs eliminate the request-waterfall problem on first load
and keep the client bundle small. The brief's HR Manager persona
mostly *reads* data, so optimizing the read path matters more than the
write path.
