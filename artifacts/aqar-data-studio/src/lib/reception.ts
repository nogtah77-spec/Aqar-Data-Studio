export function formatReceptionPieces(
  value: unknown,
  language: "ar" | "en" = "ar",
): string {
  if (value === undefined || value === null || value === "") return "";

  const count = Number(value);
  if (!Number.isFinite(count)) return "";

  const normalizedCount = Math.round(count);
  if (language === "en") {
    return `${normalizedCount} ${normalizedCount === 1 ? "piece" : "pieces"}`;
  }

  return `${normalizedCount} ${normalizedCount === 1 ? "قطعة" : "قطع"}`;
}