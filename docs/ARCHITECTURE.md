# Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Next.js 16 App Router                       │
│                                                                  │
│   src/app/(ui)/...        ──►  React Server Components           │
│       employees/page          - read-side rendering              │
│       insights/page           - charts + KPI cards               │
│                                                                  │
│   src/app/api/...         ──►  Route Handlers (HTTP only)        │
│       employees/route         - thin: parse, validate, delegate  │
│       employees/[id]/route                                       │
│       insights/route                                             │
│                                                                  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       src/lib/                                    │
│                                                                  │
│   validators/        Zod schemas. Sole source of API contract.   │
│   services/          Business logic. No HTTP, no SQL.            │
│   repositories/      Drizzle queries. No business rules.         │
│   db/                Schema, migrations, client factory.         │
│                                                                  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│   PostgreSQL  (Neon in prod • docker-compose in dev •            │
│                pglite in-process for tests)                       │
└──────────────────────────────────────────────────────────────────┘
```

## Layer rules

1. **API routes never write SQL.** They parse the request with Zod,
   call a service, translate the result to an HTTP response.
2. **Services never write SQL.** They orchestrate repository calls and
   apply business rules (validation beyond shape, computed fields,
   transactional boundaries).
3. **Repositories never apply business rules.** They are thin wrappers
   over Drizzle queries and accept a DB handle as their first argument
   so they can be exercised against pglite in tests and `pg` Pool in
   production with no branching.
4. **Tests live next to the unit they test** (`foo.ts` ↔ `foo.test.ts`)
   so that a reviewer can match them at a glance.

## Test layers

| Layer        | Runtime          | What it proves                          |
| ------------ | ---------------- | ---------------------------------------- |
| Unit         | Node, no DB      | Pure functions: validators, formatters, |
|              |                  | salary math, distribution buckets.       |
| Repository   | pglite           | SQL is correct against real Postgres    |
|              |                  | semantics.                               |
| Service      | pglite           | Business rules over repository calls.   |
| Route        | Next test client | Request → response shape, status codes, |
|              | + pglite         | error handling.                          |
| UI smoke     | React Testing Lib| Components render with the expected     |
|              |                  | accessible structure.                    |

All layers run under `vitest`; the brief's "fast, deterministic" bar
is met because pglite spins up in milliseconds.

## Data model

Single `employees` table:

| Column           | Type              | Notes                                |
| ---------------- | ----------------- | ------------------------------------ |
| id               | uuid PK           | Server-generated.                    |
| employee_code    | text unique       | Human-readable identifier (E00001). |
| full_name        | text NOT NULL     | Generated server-side from first +  |
|                  |                   | last in the seed; user-entered      |
|                  |                   | otherwise.                          |
| email            | text unique       | Lower-cased on write.                |
| job_title        | text NOT NULL     |                                      |
| department       | text              | Optional, free-text.                 |
| country          | text NOT NULL     | ISO 3166-1 alpha-2.                  |
| currency_code    | text NOT NULL     | ISO 4217 (USD, INR, …).              |
| salary           | bigint NOT NULL   | Annual, minor units of currency.     |
| employment_type  | text NOT NULL     | full_time \| part_time \| contract. |
| status           | text NOT NULL     | active \| on_leave \| terminated.   |
| hire_date        | date NOT NULL     |                                      |
| created_at       | timestamptz       | default now().                       |
| updated_at       | timestamptz       | default now(), trigger-updated.      |

Indexes:
- `(country)`
- `(country, job_title)` — supports the per-title-per-country query.
- `(status)` — most read queries filter to active employees.
- GIN trigram index on `full_name` — fast search at 10K rows.
