// src/utils/price.ts

/**
 * Formats a price stored in cents to a whole-rupee string using Indian format.
 * Example: 125000 -> ₹1,250
 * Example: 100050 -> ₹1,001 (rounded up)
 */
export function formatPrice(cents: number | undefined | null): string {
  if (cents === undefined || cents === null) return "₹0";

  // 1. Convert cents to rupees
  const rupees = cents / 100;

  // 2. Round to the nearest whole rupee and format for en-IN
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0, // Removes decimal places
  }).format(rupees);
}