"use client";

import { motion } from "motion/react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/money/money";
import type { JobTitleSliceRow } from "@/lib/services/insights";

export function JobTitleBreakdown({
  country,
  rows,
  currencyCode,
}: {
  country: string;
  rows: JobTitleSliceRow[];
  currencyCode: string | null;
}) {
  if (rows.length === 0) return null;
  const maxCount = Math.max(...rows.map((r) => r.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-zinc-700 text-base font-semibold">
          Top job titles in {country}
        </CardTitle>
        <p className="text-xs text-zinc-500">
          Ranked by headcount; average compensation shown alongside.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3.5">
          {rows.map((r, i) => (
            <li key={r.jobTitle} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{r.jobTitle}</span>
                <span className="text-zinc-500 tabular-nums">
                  {r.count}{" "}
                  {r.count === 1 ? "employee" : "employees"} · avg{" "}
                  <span className="text-zinc-900 font-semibold">
                    {currencyCode
                      ? formatMoney(r.avg, currencyCode)
                      : r.avg.toLocaleString()}
                  </span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-zinc-900 via-indigo-700 to-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(r.count / maxCount) * 100}%` }}
                  transition={{
                    duration: 0.8,
                    delay: 0.05 + i * 0.04,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
