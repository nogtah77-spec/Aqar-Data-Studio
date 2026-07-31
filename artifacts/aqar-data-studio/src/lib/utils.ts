import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getCurrencyOption } from "@/lib/currencies";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price?: number | null, currencyCode = "EGP", language: "ar" | "en" = "ar") {
  if (price == null) return "-";
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", {
    style: 'currency',
    currency: getCurrencyOption(currencyCode).code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

export function formatArea(area?: number | null, language: "ar" | "en" = "ar") {
  if (area == null) return "-";
  return `${new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US").format(area)} ${language === "ar" ? "م²" : "sqm"}`;
}
