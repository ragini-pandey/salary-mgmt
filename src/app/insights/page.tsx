import { getDb } from "@/lib/db/client";
import {
  countriesOverview,
  countryStats,
  organizationStats,
  topJobTitlesInCountry,
} from "@/lib/services/insights";

import { CountryPicker } from "@/components/insights/country-picker";
import { CountryKpis } from "@/components/insights/country-kpis";
import { JobTitleBreakdown } from "@/components/insights/job-title-breakdown";
import { OrgKpis } from "@/components/insights/org-kpis";
import { TitleAverageLookup } from "@/components/insights/title-average-lookup";
import { CountryHeadcountChart } from "@/components/insights/country-headcount-chart";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ country?: string }>;
}

export default async function InsightsPage({ searchParams }: PageProps) {
  const db = getDb();
  const { country } = await searchParams;

  const [organization, countries] = await Promise.all([
    organizationStats(db),
    countriesOverview(db),
  ]);

  const selectedCountry =
    country && countries.some((c) => c.country === country.toUpperCase())
      ? country.toUpperCase()
      : countries[0]?.country;

  const [stats, topTitles] = selectedCountry
    ? await Promise.all([
        countryStats(db, selectedCountry),
        topJobTitlesInCountry(db, selectedCountry, { limit: 8 }),
      ])
    : [null, []];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-sm text-zinc-500">
          Headline numbers across the org and per-country compensation
          breakdowns.
        </p>
      </div>

      <OrgKpis stats={organization} />

      <section className="space-y-4">
        <h2 className="text-base font-medium">Headcount by country</h2>
        <CountryHeadcountChart rows={countries} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Country detail</h2>
          <CountryPicker
            countries={countries.map((c) => c.country)}
            selected={selectedCountry}
          />
        </div>

        {selectedCountry && stats ? (
          <div className="space-y-6">
            <CountryKpis
              country={selectedCountry}
              stats={stats}
            />
            <JobTitleBreakdown
              country={selectedCountry}
              rows={topTitles}
              currencyCode={stats.currencyCode}
            />
            <TitleAverageLookup
              country={selectedCountry}
              titles={topTitles.map((t) => t.jobTitle)}
            />
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
            Seed the database (<code>pnpm seed</code>) or create employees
            to see country-level insights.
          </p>
        )}
      </section>
    </div>
  );
}
