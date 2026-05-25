# Build process — how this repository came together

A narrative companion to `git log --oneline`. It captures *why* the
work was sliced the way it was, not just *what* shipped.

## Up-front choices (before any code)

The first hour was spent on decisions, not implementation. These
landed in [`DECISIONS.md`](DECISIONS.md) as ADRs and shaped every
commit that followed:

1. **Single Next.js app vs. split frontend / backend.** Chose single
   so the deploy story stays one project, types cross the boundary
   without a code-gen step, and tests can import the API handler
   directly.
2. **PostgreSQL with `pg` driver in prod, `pglite` in tests.** The
   linchpin of the test strategy. Picking a Postgres-compatible
   in-process database meant repository tests could exercise real SQL
   (aggregates, indexes, transactions) at unit-test speed.
3. **Drizzle over Prisma.** The brief explicitly cared about
   seed-script performance; Drizzle gives finer control over batched
   inserts and avoids Prisma's per-call overhead.
4. **Salaries as integer minor units in local currency.** Avoids
   floating-point drift on aggregates, defers FX normalization to a
   future iteration, and keeps insights scoped *per country* naturally.

These four decisions account for most of the architectural surface
area. The rest of the build executed against them.

## How the work was sliced (TDD layer cake)

The build proceeded bottom-up, one horizontal layer at a time, with
each layer fully tested before the next started:

| Order | Layer            | What was driven by tests              |
| ----- | ---------------- | -------------------------------------- |
| 1     | Pure helpers     | `formatMoney`, `toMinorUnits` round-trip |
| 2     | Validators       | Per-field Zod rules (each its own RED/GREEN pair) |
| 3     | DB schema        | Migration applies cleanly into pglite |
| 4     | Repositories     | CRUD + paginated list against pglite  |
| 5     | Insights service | Aggregates against pglite             |
| 6     | API handlers     | Request → response, status codes      |
| 7     | Route shims      | Wire handlers into App Router         |
| 8     | Seed script      | Generator (pure) + runner (DB)        |
| 9     | UI               | Pages, components, dialogs            |

Building bottom-up paid off twice: when a layer was wrong, the failure
showed up in *that* layer's tests, not three layers up; and when the
UI work started, every backing function was already known-good.

## TDD cadence

Each behavior change landed as **at least two commits**:

```
test(<area>): RED   - <one-sentence intent>
feat(<area>): GREEN - <minimal implementation>
```

When the green commit revealed an unrelated cleanup opportunity, a
third `refactor(<area>): ...` commit followed. The discipline cost
nothing during the build and gives reviewers a literal play-by-play.

A sample slice from the repository layer:

```
test(repositories/employees): RED  - create returns inserted row
feat(repositories/employees): GREEN - create returns Drizzle insert row
test(repositories/employees): RED  - findById returns row or undefined
feat(repositories/employees): GREEN - findById via Drizzle eq
test(repositories/employees): RED  - update + remove cover hit and miss
feat(repositories/employees): GREEN - update and remove
test(repositories/employees): RED  - list (pagination/sort/filter/search) + count
feat(repositories/employees): GREEN - list + count with shared WHERE builder
```

The shared `WHERE`-builder refactor in the final GREEN commit only
happened because the failing tests forced me to call the same filter
predicates from both `list` and `count`; if they weren't shared, the
"total count under a filter" would drift from the visible page.

## Where AI helped and where it didn't

Documented in [`PROMPTS.md`](PROMPTS.md), but the short version: AI
generated implementations *against* failing tests I wrote, never the
other way around. Tests encode intent — letting AI write them would
have moved the contract from human-defined to model-defined. Every
diff was read before commit; nothing went in on vibes.

## Performance work

Reserved for the seed script because that's the only place the brief
explicitly mentioned it. Approach: profile, then optimize what
actually matters. Single transaction + 500-row batched inserts got us
to 9K rows/sec locally; `COPY FROM STDIN` would push that higher but
costs Drizzle integration and isn't needed at 10K. Full reasoning in
[`PERFORMANCE.md`](PERFORMANCE.md).

## What I'd do next (if this were week two)

- **FX normalization** so cross-country salary comparisons are
  possible — currently we only support per-country aggregates because
  we don't want to mix currencies in a single average.
- **History table** for salary changes (current schema has no audit
  trail; HR managers usually want to see comp adjustments over time).
- **Bulk import** (CSV upload) so onboarding from another HRIS doesn't
  require re-keying.
- **Auth** — currently the API is open. Real deployment would sit
  behind SSO; the layer split makes plugging that in straightforward
  (middleware over the API routes; no business-logic changes).
- **Background job runner** for anything that grows beyond a single
  request (e.g. emailing salary letters). Not needed today; flagged
  here so the scope creep is visible.

## Repository statistics at handoff

- **91 commits** on `main`, all with conventional-style prefixes.
- **122 tests** across 12 files, ~16-second full run.
- **0 external services** required for `pnpm test` — pglite handles
  the database layer in-process.
- **5 build artifacts** in `docs/`: this file plus ADRs, architecture,
  performance, prompts, and deploy.
