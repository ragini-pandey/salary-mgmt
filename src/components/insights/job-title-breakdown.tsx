import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <CardTitle className="text-zinc-700 text-base font-medium">
          Top job titles in {country}
        </CardTitle>
        <p className="text-xs text-zinc-500">
          Ranked by headcount; average compensation shown alongside.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.jobTitle} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{r.jobTitle}</span>
                <span className="text-zinc-500 tabular-nums">
                  {r.count} · avg{" "}
                  <span className="text-zinc-900 font-medium">
                    {currencyCode ? formatMoney(r.avg, currencyCode) : r.avg}
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded bg-zinc-100">
                <div
                  className="h-full rounded bg-zinc-900"
                  style={{ width: `${(r.count / maxCount) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
