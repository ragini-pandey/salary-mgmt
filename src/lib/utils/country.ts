// Lazy because Intl.DisplayNames construction is non-trivial; we only
// pay for it once per process.
let cached: Intl.DisplayNames | undefined;

function displayNames(): Intl.DisplayNames {
  if (!cached) {
    // fallback: 'code' makes Intl.of() return the input when it doesn't
    // know the region. Without this, modern Node returns
    // 'Unknown Region', which is worse UX than just showing the code.
    cached = new Intl.DisplayNames(["en"], {
      type: "region",
      fallback: "code",
    });
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
