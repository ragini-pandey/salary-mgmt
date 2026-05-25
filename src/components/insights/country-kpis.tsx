import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-zinc-700 text-base font-medium">
          {countryName(country)}
        </CardTitle>
        <p className="text-xs text-zinc-500">
          {stats.count.toLocaleString()} active employee
          {stats.count === 1 ? "" : "s"}
          {stats.currencyCode ? ` · ${stats.currencyCode}` : ""}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat label="Minimum salary" value={fmt(stats.min)} />
          <Stat label="Average salary" value={fmt(stats.avg)} />
          <Stat label="Maximum salary" value={fmt(stats.max)} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-xl font-semibold tabular-nums mt-1">{value}</p>
    </div>
  );
}
