import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FORM_LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/** Shared inline field-error style across the vendor form pages. */
export const FORM_ERROR_CLASS = "text-sm font-medium text-destructive";

/** Formats an integer cents amount as an SGD currency string ("$4.50"). */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(cents / 100);
}
