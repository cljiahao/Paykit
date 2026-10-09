/** Converts form dollars to integer cents; callers validate range and finiteness. */
export function dollarsToCents(raw: FormDataEntryValue | null): number {
  return Math.round(Number(raw) * 100);
}
