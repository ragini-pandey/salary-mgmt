"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/money/money";

interface ApiResponse {
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
}

export function TitleAverageLookup({
  country,
  titles,
}: {
  country: string;
  titles: string[];
}) {
  const [title, setTitle] = useState<string | undefined>(titles[0]);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);

  useEffect(() => {
    if (!title) {
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/insights/country/${country}/title/${encodeURIComponent(title)}`,
      );
      if (!res.ok || cancelled) return;
      const body = await res.json();
      setData({ count: body.count, min: body.min, max: body.max, avg: body.avg });
      // Country currency was already passed via CountryKpis; we look it
      // up once from the country endpoint for self-contained rendering.
      const countryRes = await fetch(`/api/insights/country/${country}`);
      if (!countryRes.ok || cancelled) return;
      const countryBody = await countryRes.json();
      setCurrency(countryBody.stats.currencyCode ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [country, title]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-zinc-700 text-base font-medium">
            Average for a specific job title
          </CardTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Pick a title to see min / max / average across {country}.
          </p>
        </div>
        <Select value={title} onValueChange={(v) => setTitle(v)}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Choose a job title" />
          </SelectTrigger>
          <SelectContent>
            {titles.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {!data || !title ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : data.count === 0 ? (
          <p className="text-sm text-zinc-500">
            No employees match this title in {country}.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <Stat
              label="Headcount"
              value={data.count.toLocaleString()}
            />
            <Stat
              label="Min"
              value={
                data.min != null && currency
                  ? formatMoney(data.min, currency)
                  : "—"
              }
            />
            <Stat
              label="Avg"
              value={
                data.avg != null && currency
                  ? formatMoney(data.avg, currency)
                  : "—"
              }
            />
            <Stat
              label="Max"
              value={
                data.max != null && currency
                  ? formatMoney(data.max, currency)
                  : "—"
              }
            />
          </div>
        )}
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
