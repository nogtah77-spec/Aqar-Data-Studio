/**
 * Canonical finishing option values for العمودي للتسويق العقاري.
 * These are the exact strings stored in the database.
 */

export interface FinishingOption {
  value: string;
  label: string;
}

export const FINISHING_OPTIONS: FinishingOption[] = [
  { value: "سوبر لوكس",       label: "سوبر لوكس" },
  { value: "ألترا سوبر لوكس", label: "ألترا سوبر لوكس" },
  { value: "متشطب",           label: "متشطب" },
  { value: "نص تشطيب",        label: "نص تشطيب" },
  { value: "تشطيب 75%",       label: "تشطيب 75%" },
  { value: "تشطيب 50%",       label: "تشطيب 50%" },
  { value: "طوب أحمر",        label: "طوب أحمر" },
  { value: "تحت الإنشاء",     label: "تحت الإنشاء" },
];

/**
 * Normalize a finishing string to the nearest canonical value.
 * Returns the original string unchanged if no match is found.
 */
const FINISHING_NORM: Record<string, string> = {
  // super lux variants
  "سوبر لوكس": "سوبر لوكس",
  "سوبر": "سوبر لوكس",
  "super lux": "سوبر لوكس",
  "superlux": "سوبر لوكس",
  "لوكس": "سوبر لوكس",
  // ultra super lux variants
  "ألترا سوبر لوكس": "ألترا سوبر لوكس",
  "الترا سوبر لوكس": "ألترا سوبر لوكس",
  "ألترا سوبرلوكس": "ألترا سوبر لوكس",
  "الترا سوبرلوكس": "ألترا سوبر لوكس",
  "ألترا": "ألترا سوبر لوكس",
  "الترا": "ألترا سوبر لوكس",
  "ultra super lux": "ألترا سوبر لوكس",
  "ultralux": "ألترا سوبر لوكس",
  // متشطب
  "متشطب": "متشطب",
  "مشطبة": "متشطب",
  "تشطيب كامل": "متشطب",
  "fully finished": "متشطب",
  "full finishing": "متشطب",
  // نص تشطيب
  "نص تشطيب": "نص تشطيب",
  "نصف تشطيب": "نص تشطيب",
  "نصف مشطب": "نص تشطيب",
  "semi-finished": "نص تشطيب",
  "semi finished": "نص تشطيب",
  "half finishing": "نص تشطيب",
  // تشطيب 75%
  "تشطيب 75%": "تشطيب 75%",
  "٧٥%": "تشطيب 75%",
  "75%": "تشطيب 75%",
  // تشطيب 50%
  "تشطيب 50%": "تشطيب 50%",
  "٥٠%": "تشطيب 50%",
  "50%": "تشطيب 50%",
  // طوب أحمر / هيكل
  "طوب أحمر": "طوب أحمر",
  "طوب": "طوب أحمر",
  "هيكل": "طوب أحمر",
  "عظم": "طوب أحمر",
  "خرسانة": "طوب أحمر",
  "core & shell": "طوب أحمر",
  "core and shell": "طوب أحمر",
  // تحت الإنشاء
  "تحت الإنشاء": "تحت الإنشاء",
  "قيد الإنشاء": "تحت الإنشاء",
  "under construction": "تحت الإنشاء",
};

export function normalizeFinishing(value?: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  return FINISHING_NORM[trimmed] ?? FINISHING_NORM[lower] ?? trimmed;
}
