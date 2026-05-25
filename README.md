# Salary Management

A minimal salary management tool for an HR manager of a ~10K-employee
organization. Built as a Next.js 16 full-stack app with PostgreSQL.

> **Note for reviewers** — this repository was written test-first.
> Every behavior change is staged across a `RED` (failing test) commit
> and a `GREEN` (minimal passing implementation) commit. Run
> `git log --oneline` to see the evolution.

---

## What it does

| User journey                                        | Where to find it          |
| --------------------------------------------------- | ------------------------- |
| Browse, search, sort, filter, paginate 10K rows     | `/employees`              |
| Add / edit / delete an employee                     | `/employees` (dialog)     |
| Headcount and headline numbers across the org       | `/insights` (top cards)   |
| Min / max / average salary **per country**          | `/insights` (country)     |
| Average salary for a **job title in a country**     | `/insights` (title lookup)|
| REST API for the same data                          | `/api/employees`, `/api/insights` |

The Employee model: `fullName`, `email`, `jobTitle`, `department`,
`country` (ISO‑2), `currencyCode` (ISO‑3), `salary` (integer minor
units), `employmentType`, `status`, `hireDate`, plus server-generated
`employeeCode`, `id`, `createdAt`, `updatedAt`. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the rationale.

---

## Architecture at a glance

```
┌──────────────────────────────────────────────────────────────────┐
│                      Next.js 16 App Router                       │
│                                                                  │
│   src/app/(ui)/...        ──►  React Server Components           │
│       employees/page          read-side rendering                │
│       insights/page           charts + KPI cards                 │
│                                                                  │
│   src/app/api/...         ──►  Route Handlers (HTTP only)        │
│       employees/route         thin: parse → validate → delegate  │
│       insights/route                                             │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                          src/lib/                                │
│                                                                  │
│   validators/        Zod schemas. Sole source of API contract.   │
│   services/          Business logic. No HTTP, no SQL.            │
│   repositories/      Drizzle queries. No business rules.         │
│   db/                Schema, migrations, client factory.         │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│   PostgreSQL  (Neon in prod • docker-compose in dev •            │
│                pglite in-process for tests)                       │
└──────────────────────────────────────────────────────────────────┘
```

Layer rules are enforced by convention:
**API routes never write SQL**, **services never write SQL**,
**repositories never apply business rules**. Full details in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Artifacts & design notes

The brief asks for the thinking behind the build, not just the build.
Five committed documents, each focused on one question a reviewer
might bring:

### 📘 [`docs/PROCESS.md`](docs/PROCESS.md) — *how the work was sliced*

A narrative companion to `git log`. Explains the bottom-up TDD layer
cake (helpers → validators → schema → repositories → services → API
→ UI), why each layer was finished before the next started, and the
"week two" backlog of things deliberately left out.

> *Sample:* "Building bottom-up paid off twice: when a layer was
> wrong, the failure showed up in *that* layer's tests, not three
> layers up; and when the UI work started, every backing function was
> already known-good."

### 📐 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — *the structure*

Full system diagram, the layer-rule contract, the data model (every
column, every index, with the reason), and the test ladder (which
layer proves what).

### 🎯 [`docs/DECISIONS.md`](docs/DECISIONS.md) — *every non-obvious choice*

Seven Architecture Decision Records, each capturing **the choice, the
alternatives considered, and the trade-off**. Examples:

- **ADR-002:** PostgreSQL with `pglite` for tests — why this choice
  unlocks fast, deterministic, real-Postgres-semantics tests with
  zero Docker.
- **ADR-004:** Salaries as integer minor units in local currency —
  why not `NUMERIC(12,2)`, why not float, and how this affects
  cross-country insights.
- **ADR-005:** TDD with red→green→refactor commits — why the
  per-commit cost was worth it for this assessment.

### ⚡ [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) — *seed-script benchmarks*

The brief calls out that the seed script's performance matters
because engineers run it regularly. This doc shows the measurements,
walks through **what was tried and accepted** (single transaction,
batched VALUES, TRUNCATE) and, more interestingly, **what was tried
and rejected** (COPY FROM STDIN, larger batches, parallel
transactions) — with reasons each was left on the table.

| Rows   | Local Postgres | Remote Neon  |
| ------ | -------------- | ------------ |
| 1,000  | ~140 ms        | ~1 s         |
| 10,000 | ~1.1 s         | ~8.7 s       |
| 50,000 | ~5.5 s         | ~40 s        |

### 🤖 [`docs/PROMPTS.md`](docs/PROMPTS.md) — *how AI was used*

The working agreement: **humans drive tests and architecture; AI
fills in implementation against the tests humans wrote.** Lists the
specific prompts that shaped the design (schema, FX, test strategy),
the pattern for extracting typed validators, and an explicit
*"What the AI was NOT used for"* section so the human contribution
stays visible.

### 🚀 [`docs/DEPLOY.md`](docs/DEPLOY.md) — *Vercel + Neon walkthrough*

Step-by-step deploy guide: create Neon Postgres, import on Vercel,
set `DATABASE_URL` (pooled URL), apply schema, seed. ~5 minutes
end-to-end, dashboard only, no CLI tools.

---

## Run it locally

You need Node 20+ and either Docker (for local Postgres) or a Neon
connection string.

```bash
# 1. install
pnpm install

# 2. start Postgres (skip if you have your own DATABASE_URL)
docker compose up -d db

# 3. environment
cp .env.example .env.local
#   (the default DATABASE_URL in .env.example matches docker compose)

# 4. apply the schema
pnpm drizzle-kit migrate

# 5. seed 10,000 employees (takes a second or two)
pnpm seed

# 6. run
pnpm dev
#   then open http://localhost:3000
```

The seed script is deterministic (`pnpm seed --seed 42`) so two
checkouts produce identical datasets. Adjust the count with
`pnpm seed --count 50000` if you want to see the insights scale.

---

## Run the tests

```bash
pnpm test           # one-shot
pnpm test:watch     # interactive
pnpm test:coverage  # with v8 coverage
```

All tests run in-process — there is no need for a database, Docker, or
network. The repository, service, and API layer tests use
[`@electric-sql/pglite`](https://pglite.dev), a WASM build of Postgres
that boots in single-digit milliseconds. That choice is explained in
[ADR-002](docs/DECISIONS.md#adr-002-postgresql-via-pg-driver-with-pglite-for-tests).

You should see:

```
 Test Files  12 passed (12)
      Tests  122 passed (122)
```

---

## Project layout

```
src/
├── app/                            # Next.js App Router
│   ├── api/                        # Route handlers (thin shims)
│   ├── employees/                  # Employee list page (RSC)
│   └── insights/                   # Insights dashboard (RSC)
├── components/
│   ├── employees/                  # List, dialog, form, row actions
│   ├── insights/                   # KPI cards, charts, lookups
│   ├── layout/                     # Sticky nav with active-route pill
│   └── ui/                         # Primitives (Button, Dialog, …)
└── lib/
    ├── api/                        # Pure HTTP handlers (testable)
    ├── db/                         # Schema, migrations, pglite test factory
    ├── money/                      # Currency-aware math + formatting
    ├── repositories/               # Drizzle queries, no business rules
    ├── seed/                       # Deterministic generator + bulk runner
    ├── services/                   # Validation + orchestration
    ├── utils/                      # Country names, cn(), …
    └── validators/                 # Zod schemas at the API boundary
data/                               # first_names.txt, last_names.txt
drizzle/                            # Generated migrations
scripts/                            # pnpm seed entry point
docs/                               # PROCESS, ARCHITECTURE, DECISIONS,
                                    # PERFORMANCE, PROMPTS, DEPLOY
```

---

## Tech recap

- **Next.js 16 App Router** for a single deployable; RSCs for the
  read-heavy pages, Client Components only where interactivity needs
  them ([ADR-001](docs/DECISIONS.md#adr-001-nextjs-full-stack-over-split-frontendbackend)).
- **PostgreSQL** in prod, **pglite** in tests — same SQL dialect,
  zero-Docker test runs ([ADR-002](docs/DECISIONS.md#adr-002-postgresql-via-pg-driver-with-pglite-for-tests)).
- **Drizzle ORM** for the data layer; explicit batched inserts in the
  seed script ([ADR-003](docs/DECISIONS.md#adr-003-drizzle-orm-over-prisma)).
- **Integer minor units** for salaries so aggregates don't drift
  ([ADR-004](docs/DECISIONS.md#adr-004-salaries-stored-as-integer-minor-units-in-local-currency)).
- **Zod** at the API boundary; validator types flow into the service
  layer for typed `result.kind` discriminated unions.
- **Radix + Tailwind + Motion + Lucide + Recharts** for the UI; no
  component library (hand-rolled primitives in `components/ui/`).

---

## Deployment

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for the full Vercel + Neon
walkthrough. The short version: import the repo on Vercel, set
`DATABASE_URL` to your Neon **pooled** connection string, deploy,
then run `pnpm drizzle-kit migrate` and `pnpm seed` from your laptop
with the same URL exported.
