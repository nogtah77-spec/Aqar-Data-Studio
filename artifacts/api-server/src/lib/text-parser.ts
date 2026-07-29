/**
 * Smart property text parser — v2.
 * Extracts structured property fields from free Arabic/English text.
 *
 * Example input: "شقة 170 متر بالشروق نصف تشطيب 3 غرف 2 حمام الدور الثالث للبيع 1.8 مليون"
 */

export interface ParsedPropertyFields {
  area?: number;
  beds?: number;
  baths?: number;
  floors?: number;
  price?: number;
  finishing?: string;
  view?: string;
  regionId?: string;
  regionName?: string;
  subArea?: string;
  floor?: number;
  floorText?: string;
  unitType?: string;
  category?: string;
  layout?: string;
  description?: string;
  confidence: number;
}

// ── Arabic numeral normalization ──────────────────────────────────────────────

const ARABIC_TO_WESTERN: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

function normalizeText(str: string): string {
  return str
    .replace(/[٠-٩]/g, (c) => ARABIC_TO_WESTERN[c] || c)
    .replace(/٬/g, "")
    .replace(/٫/g, ".")
    .replace(/أ|إ|آ/g, "ا")   // normalize alef variants
    .replace(/ة/g, "ه")       // ta marbuta → ha
    .replace(/ى/g, "ي");      // alef maqsura → ya
}

function parseNum(str: string): number | undefined {
  const norm = normalizeText(str).replace(/,/g, "");
  const n = parseFloat(norm);
  return isNaN(n) ? undefined : n;
}

// ── Lookup tables ─────────────────────────────────────────────────────────────

const FLOOR_NUMBERS: Record<string, number> = {
  "ارضي": 0, "أرضي": 0, "ground": 0,
  "اول": 1, "أول": 1, "first": 1,
  "ثاني": 2, "second": 2,
  "ثالث": 3, "third": 3,
  "رابع": 4, "fourth": 4,
  "خامس": 5, "fifth": 5,
  "سادس": 6, "sixth": 6,
  "سابع": 7, "seventh": 7,
  "ثامن": 8, "eighth": 8,
  "تاسع": 9, "ninth": 9,
  "عاشر": 10, "tenth": 10,
  "حادي عشر": 11, "ثاني عشر": 12,
  "اخير": 99, "أخير": 99, "top": 99,
};

const FINISHING_PATTERNS: { pattern: RegExp; value: string }[] = [
  { pattern: /الترا سوبر لوكس|ultra super lux/i,    value: "ألترا سوبر لوكس" },
  { pattern: /سوبر لوكس|super lux|superlux/i,        value: "سوبر لوكس" },
  { pattern: /نص تشطيب|نصف تشطيب|semi.?finish/i,    value: "نص تشطيب" },
  { pattern: /تشطيب 75|75.?%/i,                       value: "تشطيب 75%" },
  { pattern: /تشطيب 50|50.?%/i,                       value: "تشطيب 50%" },
  { pattern: /طوب احمر|طوب أحمر|red brick/i,         value: "طوب أحمر" },
  { pattern: /تحت الانشاء|under construction/i,       value: "تحت الإنشاء" },
  { pattern: /متشطب|مشطب|تشطيب كامل|fully finished/i, value: "متشطب" },
];

const VIEW_PATTERNS: { pattern: RegExp; value: string }[] = [
  { pattern: /بحري|sea.?view|بحر/i,      value: "بحري" },
  { pattern: /قبلي/i,                     value: "قبلي" },
  { pattern: /حديقه|حديقة|garden/i,      value: "حديقة" },
  { pattern: /على الشارع|شارع رئيسي/i,   value: "شارع" },
  { pattern: /داخلي|internal/i,           value: "داخلي" },
  { pattern: /2 شوارع|شارعين/i,           value: "شارعين" },
  { pattern: /3 شوارع|ثلاث شوارع/i,      value: "3 شوارع" },
];

const REGION_PATTERNS: { pattern: RegExp; id: string; name: string }[] = [
  { pattern: /شروق|shorouk/i,              id: "shorouk",     name: "مدينة الشروق" },
  { pattern: /مدينتي|madinaty/i,            id: "madinaty",    name: "مدينتي" },
  { pattern: /مدينه بدر|مدينة بدر|badr/i,  id: "badr",        name: "مدينة بدر" },
  { pattern: /وصال|wasal/i,                 id: "wasal",       name: "كمباوند وصال" },
  { pattern: /التجمع|تجمع|tagamoa/i,       id: "tagamoa",     name: "التجمع" },
  { pattern: /بيت الوطن/i,                  id: "beit_elwatan",name: "بيت الوطن" },
  { pattern: /الرحاب|رحاب|rehab/i,          id: "rehab",       name: "الرحاب" },
  { pattern: /العاصمه الاداريه|عاصمه|new.?capital/i, id: "new_capital", name: "العاصمة الإدارية الجديدة" },
  { pattern: /مدينة نصر|مدينه نصر|nasr/i,  id: "nasr_city",   name: "مدينة نصر" },
  { pattern: /المهندسين|مهندسين|mohandeseen/i, id: "mohandeseen", name: "المهندسين" },
  { pattern: /الشيخ زايد|زايد|sheikh.?zayed/i, id: "sheikh_zayed", name: "الشيخ زايد" },
  { pattern: /6 اكتوبر|أكتوبر|october/i,   id: "oct6",        name: "6 أكتوبر" },
];

const UNIT_TYPE_PATTERNS: { pattern: RegExp; value: string }[] = [
  { pattern: /شقه|شقة|apartment/i,           value: "apartment" },
  { pattern: /دوبلكس|duplex/i,               value: "duplex" },
  { pattern: /فيلا|villa/i,                  value: "villa" },
  { pattern: /بنت هاوس|penthouse/i,          value: "penthouse" },
  { pattern: /تاون هاوس|townhouse/i,         value: "townhouse" },
  { pattern: /توين هاوس|twinhouse/i,         value: "twinhouse" },
  { pattern: /ستوديو|استوديو|studio/i,       value: "studio" },
  { pattern: /محل|shop/i,                    value: "shop" },
  { pattern: /مكتب|office/i,                 value: "office" },
  { pattern: /عياده|عيادة|clinic/i,          value: "clinic" },
  { pattern: /ارض|أرض|land/i,               value: "land" },
];

// ── Main parser ───────────────────────────────────────────────────────────────

export function parsePropertyText(text: string): ParsedPropertyFields {
  const result: ParsedPropertyFields = { confidence: 0 };
  const norm = normalizeText(text);
  let hits = 0;
  const total = 10; // max extractable fields for confidence calculation

  // ── Area ──────────────────────────────────────────────────────────────────
  // Patterns: "170 متر", "170م2", "170 م²", "170sqm"
  const areaMatch = norm.match(/(\d+(?:\.\d+)?)\s*(?:متر|م2|م²|sqm|m²|meter)/i);
  if (areaMatch) {
    result.area = Math.round(parseFloat(areaMatch[1]));
    hits++;
  }

  // ── Beds ──────────────────────────────────────────────────────────────────
  // Patterns: "3 غرف", "3 rooms", "غرفتين" (2)
  const bedsMatch = norm.match(/(\d+)\s*(?:غرف|غرفه|room|bed)/i);
  if (bedsMatch) {
    result.beds = parseInt(bedsMatch[1]);
    hits++;
  } else if (/غرفتين|two rooms/i.test(norm)) {
    result.beds = 2;
    hits++;
  } else if (/غرفه واحده|1 غرفه/i.test(norm)) {
    result.beds = 1;
    hits++;
  }

  // ── Baths ─────────────────────────────────────────────────────────────────
  const bathsMatch = norm.match(/(\d+)\s*(?:حمام|bathroom|bath)/i);
  if (bathsMatch) {
    result.baths = parseInt(bathsMatch[1]);
    hits++;
  } else if (/حمامين|two bath/i.test(norm)) {
    result.baths = 2;
    hits++;
  }

  // ── Price ─────────────────────────────────────────────────────────────────
  // Millions: "1.8 مليون", "2.5 million"
  const millionMatch = norm.match(/(\d[\d,.]*)\s*(?:مليون|million)/i);
  if (millionMatch) {
    const val = parseNum(millionMatch[1]);
    if (val) { result.price = Math.round(val * 1_000_000); hits++; }
  } else {
    // Thousands: "850 ألف", "850k"
    const thousandMatch = norm.match(/(\d[\d,.]*)\s*(?:الف|ألف|thousand|k)/i);
    if (thousandMatch) {
      const val = parseNum(thousandMatch[1]);
      if (val) { result.price = Math.round(val * 1_000); hits++; }
    } else {
      // Raw number with currency: "2,500,000 جنيه"
      const rawPriceMatch = norm.match(/(\d[\d,.]{4,})\s*(?:جنيه|egp|ج\.م)/i);
      if (rawPriceMatch) {
        const val = parseNum(rawPriceMatch[1]);
        if (val) { result.price = Math.round(val); hits++; }
      }
    }
  }

  // ── Floor ─────────────────────────────────────────────────────────────────
  const floorMatch = norm.match(/(?:الدور|دور|طابق|floor)\s+(\S+)/i);
  if (floorMatch) {
    const floorWord = normalizeText(floorMatch[1].toLowerCase());
    const floorNum = FLOOR_NUMBERS[floorWord] ?? FLOOR_NUMBERS[floorMatch[1]];
    if (floorNum !== undefined) {
      result.floor = floorNum;
      result.floorText = floorMatch[1];
    } else {
      const numMatch = floorWord.match(/\d+/);
      if (numMatch) {
        result.floor = parseInt(numMatch[0]);
        result.floorText = floorMatch[1];
      }
    }
    if (result.floor !== undefined) hits++;
  }

  // ── Finishing ─────────────────────────────────────────────────────────────
  for (const { pattern, value } of FINISHING_PATTERNS) {
    if (pattern.test(norm)) {
      result.finishing = value;
      hits++;
      break;
    }
  }

  // ── View ──────────────────────────────────────────────────────────────────
  for (const { pattern, value } of VIEW_PATTERNS) {
    if (pattern.test(norm)) {
      result.view = value;
      hits++;
      break;
    }
  }

  // ── Region ────────────────────────────────────────────────────────────────
  for (const { pattern, id, name } of REGION_PATTERNS) {
    if (pattern.test(norm)) {
      result.regionId = id;
      result.regionName = name;
      hits++;
      break;
    }
  }

  // ── Unit type ─────────────────────────────────────────────────────────────
  for (const { pattern, value } of UNIT_TYPE_PATTERNS) {
    if (pattern.test(norm)) {
      result.unitType = value;
      hits++;
      break;
    }
  }

  // ── Category ─────────────────────────────────────────────────────────────
  if (/للايجار|للإيجار|for rent/i.test(norm)) {
    result.category = "rent";
    hits++;
  } else if (/للبيع|for sale/i.test(norm)) {
    result.category = "sale";
    hits++;
  }

  // ── Derived layout string ─────────────────────────────────────────────────
  if (result.beds || result.baths) {
    const parts: string[] = [];
    if (result.beds)  parts.push(`${result.beds} غرف`);
    if (result.baths) parts.push(`${result.baths} حمام`);
    result.layout = parts.join(" + ");
  }

  result.confidence = Math.min(1, hits / total);
  return result;
}
