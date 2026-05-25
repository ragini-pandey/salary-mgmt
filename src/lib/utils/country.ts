// Lazy because Intl.DisplayNames construction is non-trivial; we only
// pay for it once per process.
let cached: Intl.DisplayNames | undefined;

function displayNames(): Intl.DisplayNames {
  if (!cached) {
    cached = new Intl.DisplayNames(["en"], { type: "region" });
  }
  return cached;
}

export function countryName(code: string): string {
  const upper = code.toUpperCase();
  try {
    return displayNames().of(upper) ?? upper;
  } catch {
    return upper;
  }
}
