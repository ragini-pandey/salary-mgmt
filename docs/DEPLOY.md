# Deploying to Vercel + Neon

The app deploys as a single Vercel project backed by a Neon Postgres
database. End-to-end takes ~5 minutes; no CLI tools required.

## 1. Create the Postgres on Neon

1. Go to [console.neon.tech](https://console.neon.tech) and sign in.
2. **Create project** → pick a region close to the Vercel region you'll
   choose in step 2 (e.g. `aws-us-east-1`).
3. After creation, open **Connection Details** and copy the
   *pooled* `DATABASE_URL` (the one that ends in `…-pooler.…`). Save
   it for step 2.

A pooled URL is important — Vercel route handlers are serverless and
spin up many short-lived connections; the unpooled URL exhausts
Postgres's `max_connections` quickly.

## 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import Git Repository** → pick `ragini-pandey/salary-mgmt`.
3. Vercel auto-detects Next.js. Leave the build/output defaults alone.
4. **Environment Variables** → add:
   - `DATABASE_URL` = the pooled URL from step 1.
5. **Deploy**. First build takes ~90 seconds.

## 3. Apply the schema

The build won't have applied the migration yet (Vercel doesn't run
arbitrary scripts at deploy time). From your local machine, with the
same `DATABASE_URL` set:

```bash
DATABASE_URL='postgres://…neon.tech/…' pnpm db:push
```

This is idempotent — re-running it on subsequent deploys is safe.

## 4. Seed the database (optional but recommended)

The insights pages are most interesting with data. From your local
machine:

```bash
DATABASE_URL='postgres://…neon.tech/…' pnpm seed --count 10000
```

Expected output:
```
▶ seeding 10,000 employees (seed=1)…
✓ inserted 10,000 rows in ~8000 ms (~1,200 rows/s)
```

(Throughput is lower against a remote Neon than against local Postgres
because of network RTT — see `docs/PERFORMANCE.md`.)

## 5. Smoke test

Open the Vercel-assigned URL. You should see:

- `/employees` — paginated table of seeded employees.
- `/insights` — KPI cards populate; the chart renders the country
  distribution; pick a country to see min/max/avg.
- `/api/insights` — returns JSON with `organization` and `countries`.

If `/employees` shows "No employees match your filters" and the URL
has no query params, the seed didn't run — re-check step 4.

## Re-deploys

Pushing to `main` triggers an automatic Vercel re-deploy. The schema
push (step 3) only needs to run again when `drizzle/` has new
migrations — otherwise the redeploy is just code.

## Costs

- **Vercel Hobby** is free for this use case.
- **Neon free tier** gives 0.5 GB storage and ~300 compute hours/mo —
  more than enough for the assessment dataset.
