import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getCurrencyOption } from "@/lib/currencies";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price?: number | null, currencyCode = "EGP") {
  if (price == null) return "-";
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: getCurrencyOption(currencyCode).code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

export function formatArea(area?: number | null) {
  if (area == null) return "-";
  return `${new Intl.NumberFormat('en-US').format(area)} م²`;
}
