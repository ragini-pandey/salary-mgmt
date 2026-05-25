export function toMinorUnits(major: number, _currency: string): number {
  return Math.round(major * 100);
}
