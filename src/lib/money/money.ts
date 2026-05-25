// Currencies whose minor unit equals their major unit (no fractional part).
// Source: ISO 4217. The list is small and changes rarely; we keep it inline
// so the function has no runtime dependency on a data file.
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

function decimalsFor(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
}

export function toMinorUnits(major: number, currency: string): number {
  const factor = 10 ** decimalsFor(currency);
  return Math.round(major * factor);
}
