import { performance } from "node:perf_hooks";

import { employees } from "../db/schema";
import type { DbHandle } from "../repositories/employees";
import { generateEmployees, type NamePools } from "./generator";

export interface SeedOptions {
  count: number;
  seed: number;
  pools: NamePools;
  /**
   * Rows per INSERT statement. Default 500 is well under the Postgres
   * 65,535-parameter limit (500 rows × 11 fields ≈ 5,500 parameters)
   * and gives near-optimal throughput at our row width on Neon.
   */
  batchSize?: number;
}

export interface SeedResult {
  inserted: number;
  elapsedMs: number;
  rowsPerSecond: number;
}

/**
 * Why TRUNCATE rather than DELETE: TRUNCATE is O(1)-ish, doesn't
 * generate per-row write-ahead log entries, and resets sequences if
 * we had any. RESTART IDENTITY is harmless here (no serial column).
 *
 * Why a single transaction: the brief calls out perf. One transaction
 * = one commit-time fsync regardless of how many INSERT batches we
 * fire. On Postgres + an HDD this is often the dominant cost; on SSD
 * it's still measurable.
 */
export async function seedDatabase(
  db: DbHandle,
  options: SeedOptions,
): Promise<SeedResult> {
  const batchSize = options.batchSize ?? 500;
  const rows = generateEmployees(options.count, {
    pools: options.pools,
    seed: options.seed,
  });

  const t0 = performance.now();

  await db.transaction(async (tx) => {
    await tx.execute(
      "TRUNCATE TABLE employees RESTART IDENTITY CASCADE" as never,
    );

    for (let i = 0; i < rows.length; i += batchSize) {
      const slice = rows.slice(i, i + batchSize);
      await tx.insert(employees).values(slice);
    }
  });

  const elapsedMs = performance.now() - t0;
  const rowsPerSecond = Math.round((rows.length / elapsedMs) * 1000);
  return { inserted: rows.length, elapsedMs, rowsPerSecond };
}
