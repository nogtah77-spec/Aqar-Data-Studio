import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price?: number | null) {
  if (price == null) return "-";
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price).replace('EGP', 'ج.م'); 
}

export function formatArea(area?: number | null) {
  if (area == null) return "-";
  return `${new Intl.NumberFormat('en-US').format(area)} م²`;
}
