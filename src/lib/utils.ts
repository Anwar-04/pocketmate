import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names safely with Tailwind CSS utility conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric value into standard Indian Currency (INR / ₹) string.
 * Example: 708.33 -> "₹708" or 60000 -> "₹60,000"
 */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  const rounded = showDecimals ? amount : Math.round(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(rounded);
}
