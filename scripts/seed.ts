#!/usr/bin/env tsx
import { config as loadEnv } from "dotenv";

import { getDb } from "../src/lib/db/client";
import { loadNamePools } from "../src/lib/seed/generator";
import { seedDatabase } from "../src/lib/seed/runner";

loadEnv({ path: [".env.local", ".env"], quiet: true });

function parseArgs(argv: string[]): { count: number; seed: number } {
  let count = 10_000;
  let seed = 1;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--count" || a === "-n") count = Number(argv[++i]);
    else if (a === "--seed" || a === "-s") seed = Number(argv[++i]);
    else if (a === "--help" || a === "-h") {
      console.log("Usage: pnpm seed [--count N] [--seed S]");
      process.exit(0);
    }
  }
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`--count must be a positive integer, got ${count}`);
  }
  return { count, seed };
}

async function main() {
  const { count, seed } = parseArgs(process.argv.slice(2));
  const db = getDb();

  console.log(`▶ seeding ${count.toLocaleString()} employees (seed=${seed})…`);
  const result = await seedDatabase(db, {
    count,
    seed,
    pools: loadNamePools(),
  });
  console.log(
    `✓ inserted ${result.inserted.toLocaleString()} rows in ${result.elapsedMs.toFixed(
      0,
    )} ms (${result.rowsPerSecond.toLocaleString()} rows/s)`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
