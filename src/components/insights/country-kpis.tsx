import { ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react";

import { AnimatedGrid } from "@/components/ui/animated-grid";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/money/money";
import type { CountryStats } from "@/lib/services/insights";
import { countryName } from "@/lib/utils/country";

export function CountryKpis({
  country,
  stats,
}: {
  country: string;
  stats: CountryStats;
}) {
  const fmt = (n: number | null) =>
    n != null && stats.currencyCode
      ? formatMoney(n, stats.currencyCode)
      : "—";

  const items = [
    {
      key: "min",
      label: "Minimum salary",
      value: fmt(stats.min),
      icon: ArrowDownToLine,
      tint: "text-emerald-600 bg-emerald-50",
    },
    {
      key: "avg",
      label: "Average salary",
      value: fmt(stats.avg),
      icon: TrendingUp,
      tint: "text-indigo-600 bg-indigo-50",
    },
    {
      key: "max",
      label: "Maximum salary",
      value: fmt(stats.max),
      icon: ArrowUpFromLine,
      tint: "text-rose-600 bg-rose-50",
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-zinc-100 bg-gradient-to-br from-zinc-50 to-white">
        <CardTitle className="text-zinc-700 text-base font-semibold">
          {countryName(country)}
        </CardTitle>
        <p className="text-xs text-zinc-500">
          {stats.count.toLocaleString()} active employee
          {stats.count === 1 ? "" : "s"}
          {stats.currencyCode ? ` · ${stats.currencyCode}` : ""}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <AnimatedGrid className="grid grid-cols-1 divide-y divide-zinc-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex items-start gap-3 p-5"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.tint}`}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {item.label}
                </p>
                <p className="mt-1 truncate text-xl font-semibold tabular-nums">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </AnimatedGrid>
      </CardContent>
    </Card>
  );
}
