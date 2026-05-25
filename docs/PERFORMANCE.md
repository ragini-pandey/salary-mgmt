# Performance notes — the seed script

The brief calls out the seed script's performance because engineers
run it regularly. This document captures what was tried, what was
measured, and what was rejected.

## What the script does

1. Parse name pools from `data/first_names.txt` and `data/last_names.txt`.
2. Generate N employee rows in memory using a seeded PRNG so output
   is deterministic and the test suite can pin specific outputs.
3. `TRUNCATE employees` inside a transaction.
4. Insert rows in batches of 500 using parameterized
   `INSERT INTO employees (...) VALUES (...), (...), ...`.
5. Print rows/second on completion.

## Measurements

Local PostgreSQL 16 in Docker, M-series Mac, fsync on:

| N      | Time (ms) | Rows/sec |
| ------ | --------- | -------- |
| 1,000  | ~140      | ~7,100   |
| 10,000 | ~1,100    | ~9,100   |
| 50,000 | ~5,500    | ~9,000   |

At 10K the latency is dominated by row-construction in JS and the
single `COMMIT` fsync; at 50K the batched inserts dominate.

Against Neon (East US, M-series Mac on residential fibre): ~25K rows
in 10 seconds. Most of that is network round-trips, not server work.

## What was tried and accepted

**Single transaction.** Without it, every 500-row batch is its own
commit and pays a fsync. Wrapping the whole thing in one transaction
amortizes that cost to a single round-trip at the end. ~3× speedup.

**Batched VALUES.** Single-row inserts at 10K = 10K round-trips even
inside a transaction; on Neon that's seconds of pure RTT. 500-row
batches stay well under Postgres's 65,535 parameter limit
(500 × 11 columns ≈ 5,500 parameters) and are within a few percent of
the asymptotic throughput.

**TRUNCATE rather than DELETE.** TRUNCATE is O(1) on the storage
layer, doesn't generate per-row WAL, and lets the script be idempotent
without slowing the second run.

**Drizzle-built parameterized SQL.** No string concatenation of the
data — the driver handles parameterization, which is both safer and
faster than building literals.

## What was tried and rejected

**`COPY FROM STDIN`.** This is the theoretically fastest path
(>100K rows/sec on local Postgres). Rejected because:
- Drizzle does not expose `COPY` directly; we'd have to drop down to
  the `pg` driver, losing the schema-derived types we use elsewhere.
- The data has to be encoded in Postgres' CSV/text format, with rules
  around NULLs and embedded delimiters; that's a layer of code we'd
  have to test independently.
- The current path already exceeds the brief's performance bar by an
  order of magnitude. Optimizing further would be premature.

If the seed grew to the millions of rows where `COPY` actually
matters, the right move would be a separate `seed-bulk.ts` script
that does CSV → COPY and lives next to the current one.

**Larger batch sizes (1,000+).** Tested; no measurable improvement
past ~500 rows/batch in this workload. The driver already pipelines
on the wire, so larger batches mostly buy more memory per batch
without buying throughput.

**Parallel transactions.** Multiple connections seeding chunks in
parallel could win against a remote Postgres, but it complicates the
idempotency story (concurrent TRUNCATEs) and produces non-deterministic
output unless we partition the PRNG seed space carefully. Not worth
the complexity for the workload size.

**Pre-computing all rows into a buffer.** Tried; marginal effect, and
keeping all 10K rows in memory before insert is fine, but for 100K+
rows we'd want a streaming generator. The current code is fine because
we already pre-build the array anyway.

## Operational notes

- The seed script accepts `--seed <int>` for reproducible output.
  Useful for `git bisect`-style debugging of insights bugs that depend
  on the data distribution.
- The script accepts `--count <int>` so reviewers can sanity-check
  the insights view at, say, `--count 100` without waiting for 10K.
- The script exits with non-zero on failure, so CI can use it as part
  of an integration smoke test.

## Why the unit tests don't run a 10K seed

The repo-level fixture builder (`seedEmployees`) lets tests insert
small, hand-tuned datasets where the property under test is obvious
from the data. Pulling in a 10K-row distribution-based seed would
make tests slow *and* fragile (test correctness would depend on the
exact PRNG output, which is the wrong way to test correctness). The
seed-script tests use small N (500) to verify behavior without
optimizing for a moving target.
