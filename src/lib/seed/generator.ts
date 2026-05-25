import { readFileSync } from "node:fs";
import path from "node:path";

import type { CreateEmployeeRow } from "../repositories/employees";

export interface NamePools {
  firstNames: string[];
  lastNames: string[];
}

const DATA_DIR = path.resolve(process.cwd(), "data");

export function loadNamePools(): NamePools {
  const read = (file: string) =>
    readFileSync(path.join(DATA_DIR, file), "utf8")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  return {
    firstNames: read("first_names.txt"),
    lastNames: read("last_names.txt"),
  };
}

/**
 * Country profile: ISO code, currency, weighted occurrence, and a
 * country-typical median annual salary in MINOR units (so we can stay
 * in the validator's lane and avoid float math).
 *
 * Weights are relative; we sample with cumulative-weight selection.
 * Medians are rough — sourced from public salary aggregators and
 * rounded; they exist to make the seeded dataset realistic enough that
 * insights demos look sensible.
 */
interface CountryProfile {
  country: string;
  currencyCode: string;
  weight: number;
  // Annual median in MINOR units of the local currency.
  medianMinor: number;
}

const COUNTRY_PROFILES: CountryProfile[] = [
  { country: "US", currencyCode: "USD", weight: 30, medianMinor: 11_500_000 },
  { country: "IN", currencyCode: "INR", weight: 22, medianMinor: 180_000_000 },
  { country: "GB", currencyCode: "GBP", weight: 8, medianMinor: 5_500_000 },
  { country: "DE", currencyCode: "EUR", weight: 7, medianMinor: 6_500_000 },
  { country: "FR", currencyCode: "EUR", weight: 5, medianMinor: 5_500_000 },
  { country: "JP", currencyCode: "JPY", weight: 6, medianMinor: 6_500_000 },
  { country: "BR", currencyCode: "BRL", weight: 4, medianMinor: 13_000_000 },
  { country: "CA", currencyCode: "CAD", weight: 4, medianMinor: 9_500_000 },
  { country: "AU", currencyCode: "AUD", weight: 3, medianMinor: 10_500_000 },
  { country: "SG", currencyCode: "SGD", weight: 3, medianMinor: 9_500_000 },
  { country: "ZA", currencyCode: "ZAR", weight: 2, medianMinor: 60_000_000 },
  { country: "MX", currencyCode: "MXN", weight: 2, medianMinor: 50_000_000 },
  { country: "PL", currencyCode: "PLN", weight: 2, medianMinor: 12_000_000 },
  { country: "ES", currencyCode: "EUR", weight: 2, medianMinor: 3_500_000 },
];

const JOB_TITLES = [
  ["Software Engineer", 18],
  ["Senior Software Engineer", 14],
  ["Staff Software Engineer", 4],
  ["Engineering Manager", 5],
  ["Director of Engineering", 1],
  ["Product Manager", 8],
  ["Senior Product Manager", 4],
  ["Product Designer", 5],
  ["Data Analyst", 6],
  ["Data Scientist", 4],
  ["Data Engineer", 3],
  ["DevOps Engineer", 4],
  ["Site Reliability Engineer", 3],
  ["QA Engineer", 4],
  ["Technical Writer", 2],
  ["Customer Success Manager", 5],
  ["Account Executive", 5],
  ["Sales Development Representative", 5],
  ["Marketing Manager", 3],
  ["Recruiter", 3],
  ["People Operations Partner", 2],
  ["Finance Analyst", 2],
  ["Controller", 1],
  ["Office Manager", 1],
] as const;

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Data",
  "Sales",
  "Marketing",
  "Customer Success",
  "People",
  "Finance",
  "Operations",
];

// Multiplier table by job title — fed into the salary log-normal draw.
const TITLE_MULTIPLIERS: Record<string, number> = {
  "Software Engineer": 1.0,
  "Senior Software Engineer": 1.5,
  "Staff Software Engineer": 2.2,
  "Engineering Manager": 1.9,
  "Director of Engineering": 3.0,
  "Product Manager": 1.3,
  "Senior Product Manager": 1.8,
  "Product Designer": 1.1,
  "Data Analyst": 0.9,
  "Data Scientist": 1.4,
  "Data Engineer": 1.4,
  "DevOps Engineer": 1.4,
  "Site Reliability Engineer": 1.5,
  "QA Engineer": 0.9,
  "Technical Writer": 0.85,
  "Customer Success Manager": 1.05,
  "Account Executive": 1.2,
  "Sales Development Representative": 0.75,
  "Marketing Manager": 1.1,
  Recruiter: 1.0,
  "People Operations Partner": 1.1,
  "Finance Analyst": 1.05,
  Controller: 1.6,
  "Office Manager": 0.7,
};

const EMPLOYMENT_TYPE_WEIGHTS = [
  ["full_time", 90],
  ["part_time", 6],
  ["contract", 4],
] as const;

const STATUS_WEIGHTS = [
  ["active", 95],
  ["on_leave", 3],
  ["terminated", 2],
] as const;

/**
 * Mulberry32 — small, fast, well-distributed PRNG. We use a seeded RNG
 * (rather than Math.random) so a given (seed, n) tuple always produces
 * the same dataset. This is what the determinism test verifies.
 */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(rng: () => number, weighted: readonly (readonly [T, number])[]): T {
  const total = weighted.reduce((acc, [, w]) => acc + w, 0);
  let r = rng() * total;
  for (const [value, weight] of weighted) {
    r -= weight;
    if (r <= 0) return value;
  }
  return weighted[weighted.length - 1][0];
}

function pickProfile(rng: () => number): CountryProfile {
  return pickWeighted(
    rng,
    COUNTRY_PROFILES.map((p) => [p, p.weight] as const),
  );
}

function pickJobTitle(rng: () => number): string {
  return pickWeighted(rng, JOB_TITLES);
}

// Approximation of a log-normal-ish salary distribution around the
// median: bulk between 0.7x..1.6x median, long thin upper tail.
function drawSalary(rng: () => number, median: number, multiplier: number): number {
  // 80% body, 20% upper tail.
  const draw = rng();
  let factor: number;
  if (draw < 0.8) {
    factor = 0.7 + rng() * 0.9; // 0.7 .. 1.6
  } else {
    factor = 1.6 + rng() * 1.8; // 1.6 .. 3.4 (managers, exceptional)
  }
  return Math.round(median * multiplier * factor);
}

function isoDateMinusDays(days: number): string {
  const d = new Date(Date.UTC(2024, 11, 31)); // anchor: 2024-12-31
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export interface GenerateOptions {
  pools: NamePools;
  seed: number;
  /** Starting employee_code counter (1-based). */
  startIndex?: number;
}

export function generateEmployees(
  count: number,
  options: GenerateOptions,
): CreateEmployeeRow[] {
  const rng = mulberry32(options.seed);
  const start = options.startIndex ?? 1;
  const { firstNames, lastNames } = options.pools;

  const out: CreateEmployeeRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const first = firstNames[Math.floor(rng() * firstNames.length)];
    const last = lastNames[Math.floor(rng() * lastNames.length)];
    const fullName = `${first} ${last}`;
    const profile = pickProfile(rng);
    const jobTitle = pickJobTitle(rng);
    const department =
      DEPARTMENTS[Math.floor(rng() * DEPARTMENTS.length)];
    const salary = drawSalary(
      rng,
      profile.medianMinor,
      TITLE_MULTIPLIERS[jobTitle] ?? 1,
    );

    const code = `E${String(start + i).padStart(6, "0")}`;
    // Disambiguate within seed so emails are unique.
    const email = `${first.toLowerCase()}.${last.toLowerCase()}.${code.toLowerCase()}@example.com`;

    // Hires distributed over the last ~10 years.
    const daysAgo = Math.floor(rng() * 365 * 10);

    out.push({
      employeeCode: code,
      fullName,
      email,
      jobTitle,
      department,
      country: profile.country,
      currencyCode: profile.currencyCode,
      salary,
      employmentType: pickWeighted(rng, EMPLOYMENT_TYPE_WEIGHTS),
      status: pickWeighted(rng, STATUS_WEIGHTS),
      hireDate: isoDateMinusDays(daysAgo),
    });
  }
  return out;
}
