"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import type { CountryOverviewRow } from "@/lib/services/insights";

// A small, deterministic palette so colors stay stable across renders.
const PALETTE = [
  "#6366f1", // indigo-500
  "#0ea5e9", // sky-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#ec4899", // pink-500
  "#8b5cf6", // violet-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#22c55e", // green-500
];

export function CountryHeadcountChart({
  rows,
}: {
  rows: CountryOverviewRow[];
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-zinc-500">
          No data yet.
        </CardContent>
      </Card>
    );
  }

  const data = rows.map((r) => ({ country: r.country, count: r.count }));

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                {PALETTE.map((c, i) => (
                  <linearGradient
                    key={i}
                    id={`barGrad-${i}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={c} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e4e4e7"
                vertical={false}
              />
              <XAxis
                dataKey="country"
                tick={{ fontSize: 12, fill: "#71717a" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#71717a" }}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e4e4e7",
                  boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={`url(#barGrad-${i % PALETTE.length})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
