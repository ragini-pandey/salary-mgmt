import type { DbHandle } from "../repositories/employees";
import {
  countriesOverview,
  countryStats,
  organizationStats,
  titleInCountryStats,
  topJobTitlesInCountry,
} from "../services/insights";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const ISO2 = /^[A-Za-z]{2}$/;

export async function handleOverviewInsights(
  db: DbHandle,
): Promise<Response> {
  const [organization, countries] = await Promise.all([
    organizationStats(db),
    countriesOverview(db),
  ]);
  return jsonResponse({ organization, countries });
}

export async function handleCountryInsights(
  db: DbHandle,
  country: string,
): Promise<Response> {
  if (!ISO2.test(country)) {
    return jsonResponse(
      { error: "validation_error", message: "country must be ISO-2" },
      400,
    );
  }
  const code = country.toUpperCase();
  const [stats, topJobTitles] = await Promise.all([
    countryStats(db, code),
    topJobTitlesInCountry(db, code),
  ]);
  return jsonResponse({ country: code, stats, topJobTitles });
}

export async function handleTitleInsights(
  db: DbHandle,
  country: string,
  jobTitle: string,
): Promise<Response> {
  if (!ISO2.test(country)) {
    return jsonResponse(
      { error: "validation_error", message: "country must be ISO-2" },
      400,
    );
  }
  if (!jobTitle.trim()) {
    return jsonResponse(
      { error: "validation_error", message: "jobTitle required" },
      400,
    );
  }
  const stats = await titleInCountryStats(
    db,
    country.toUpperCase(),
    jobTitle.trim(),
  );
  return jsonResponse({
    country: country.toUpperCase(),
    jobTitle: jobTitle.trim(),
    ...stats,
  });
}
