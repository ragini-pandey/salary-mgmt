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
pnpm db:push

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
[`docs/DECISIONS.md`](docs/DECISIONS.md#adr-002-postgresql-via-pg-driver-with-pglite-for-tests).

You should see something like:

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
docs/                               # ADRs, architecture, performance, AI usage
```

Layer rules are enforced by convention (see `docs/ARCHITECTURE.md`):
**API routes never write SQL**, **services never write SQL**,
**repositories never apply business rules**.

---

## Performance: the seed script

The brief calls out that the seed script's performance matters because
engineers will run it regularly. Numbers measured on a M-series Mac
against local PostgreSQL 16 in Docker:

| Rows   | Duration  | Throughput     |
| ------ | --------- | -------------- |
| 1,000  | ~140 ms   | ~7,100 rows/s  |
| 10,000 | ~1.1 s    | ~9,100 rows/s  |
| 50,000 | ~5.5 s    | ~9,000 rows/s  |

How: one `TRUNCATE`, one transaction, and batched `INSERT VALUES (…)` of
500 rows each (well under the 65,535-parameter Postgres limit). See
[`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) for what was tried and what
didn't make the cut.

---

## Tech choices, briefly

- **Next.js 16 App Router** for a single deployable, with RSCs handling
  the read-heavy pages and Client Components only for forms / interactive
  widgets. Rationale in
  [`docs/DECISIONS.md`](docs/DECISIONS.md#adr-001-nextjs-full-stack-over-split-frontendbackend).
- **PostgreSQL** in dev / prod, **pglite** in tests — same SQL dialect,
  zero-Docker test runs.
  [ADR-002](docs/DECISIONS.md#adr-002-postgresql-via-pg-driver-with-pglite-for-tests).
- **Drizzle ORM** over Prisma so the bulk insert path stays explicit
  and the generated types are first-class.
  [ADR-003](docs/DECISIONS.md#adr-003-drizzle-orm-over-prisma).
- **Integer minor units** for salaries so aggregates don't drift.
  [ADR-004](docs/DECISIONS.md#adr-004-salaries-stored-as-integer-minor-units-in-local-currency).
- **Zod** at the API boundary; the same validator types flow into the
  service layer for the typed `result.kind` discriminated unions.
- **Radix + Tailwind + Lucide + Recharts** for the UI; no component
  library (shadcn-style hand-rolled primitives in `components/ui/`).

---

## Deployment

The app deploys to Vercel as a single project; point `DATABASE_URL` at
a Neon Postgres instance. The route handlers are dynamic (no static
caching) because the read paths reflect mutable data.

---

## Artifacts

- [`docs/DECISIONS.md`](docs/DECISIONS.md) — every non-obvious choice
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system diagram, data model, test ladder
- [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) — seed-script benchmarks & what was tried
- [`docs/PROMPTS.md`](docs/PROMPTS.md) — how AI was used, and what it was *not* used for
