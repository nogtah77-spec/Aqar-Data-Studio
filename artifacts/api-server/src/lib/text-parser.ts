/**
 * Smart property text parser.
 * Extracts structured property fields from free Arabic/English text.
 *
 * Example input: "شقة 170 متر بالشروق نصف تشطيب 3 غرف 2 حمام الدور الثالث"
 */

export interface ParsedPropertyFields {
  area?: number;
  beds?: number;
  baths?: number;
  price?: number;
  finishing?: string;
  view?: string;
  regionId?: string;
  regionName?: string;
  subArea?: string;
  floor?: number;
  floorText?: string;
  unitType?: string;
  layout?: string;
  description?: string;
  confidence: number;
}

// Arabic numeral mapping
const ARABIC_TO_WESTERN: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

function normalizeNumber(str: string): string {
  return str.replace(/[٠-٩]/g, (c) => ARABIC_TO_WESTERN[c] || c)
            .replace(/٬/g, "")
            .replace(/٫/g, ".");
}

function extractNumber(text: string): number | undefined {
  const match = normalizeNumber(text).match(/[\d,.]+/);
  if (!match) return undefined;
  const num = parseFloat(match[0].replace(/,/g, ""));
  return isNaN(num) ? undefined : num;
}

const FLOOR_LABELS: Record<string, string> = {
  "أرضي": "ground",
  "ارضي": "ground",
  "أول": "first",
  "ثاني": "second",
  "ثالث": "third",
  "رابع": "fourth",
  "خامس": "fifth",
  "سادس": "sixth",
  "سابع": "seventh",
  "ثامن": "eighth",
  "تاسع": "ninth",
  "عاشر": "tenth",
  "أخير": "top",
  "اخير": "top",
};

const FLOOR_NUMBERS: Record<string, number> = {
  "أرضي": 0, "ارضي": 0,
  "أول": 1, "ثاني": 2, "ثالث": 3, "رابع": 4,
  "خامس": 5, "سادس": 6, "سابع": 7, "ثامن": 8,
  "تاسع": 9, "عاشر": 10,
};

const FINISHING_PATTERNS: { pattern: RegExp; value: string }[] = [
  { pattern: /ألترا سوبر لوكس|ألتراسوبرلوكس|ultra super/i, value: "ألترا سوبر لوكس" },
  { pattern: /سوبر لوكس|super lux|superlux/i, value: "سوبر لوكس" },
  { pattern: /نص تشطيب|نصف تشطيب|semi.?finish/i, value: "نص تشطيب" },
  { pattern: /تشطيب 75%|75%/i, value: "تشطيب 75%" },
  { pattern: /تشطيب 50%|50%/i, value: "تشطيب 50%" },
  { pattern: /طوب أحمر|طوب احمر|red brick/i, value: "طوب أحمر" },
  { pattern: /تحت الإنشاء|تحت الانشاء|under construction/i, value: "تحت الإنشاء" },
  { pattern: /متشطب|finished/i, value: "متشطب" },
];

const VIEW_PATTERNS: { pattern: RegExp; value: string }[] = [
  { pattern: /بحري|sea view|بحر/i, value: "بحري" },
  { pattern: /قبلي/i, value: "قبلي" },
  { pattern: /حديقة|garden/i, value: "حديقة" },
  { pattern: /شارع|street/i, value: "شارع" },
];

const REGION_PATTERNS: { pattern: RegExp; id: string; name: string }[] = [
  { pattern: /شروق|shorouk/i, id: "shorouk", name: "مدينة الشروق" },
  { pattern: /مدينتي|madinaty/i, id: "madinaty", name: "مدينتي" },
  { pattern: /بدر|badr/i, id: "badr", name: "مدينة بدر" },
  { pattern: /وصال|wasal/i, id: "wasal", name: "كمباوند وصال" },
  { pattern: /تجمع|tagamoa/i, id: "tagamoa", name: "التجمع" },
  { pattern: /بيت الوطن/i, id: "beit_elwatan", name: "بيت الوطن" },
  { pattern: /رحاب|rehab/i, id: "rehab", name: "الرحاب" },
  { pattern: /عاصمة|new.?capital/i, id: "new_capital", name: "العاصمة الإدارية الجديدة" },
  { pattern: /نصر|nasr/i, id: "nasr_city", name: "مدينة نصر" },
  { pattern: /مهندسين|mohandeseen/i, id: "mohandeseen", name: "المهندسين" },
  { pattern: /زايد|sheikh.?zayed/i, id: "sheikh_zayed", name: "الشيخ زايد" },
  { pattern: /أكتوبر|october|6 oct/i, id: "oct6", name: "6 أكتوبر" },
];

export function parsePropertyText(text: string): ParsedPropertyFields {
  const result: ParsedPropertyFields = { confidence: 0 };
  let hits = 0;
  const total = 8; // max extractable fields

  // Area: "170 متر", "170م2", "170 م²"
  const areaMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:متر|م2|م²|sqm|m²|meter)/i);
  if (areaMatch) {
    result.area = Math.round(parseFloat(areaMatch[1]));
    hits++;
  }

  // Beds: "3 غرف", "3 rooms"
  const bedsMatch = text.match(/(\d+)\s*(?:غر[فق]|غرف|غرفة|room|bed)/i);
  if (bedsMatch) {
    result.beds = parseInt(bedsMatch[1]);
    hits++;
  }

  // Baths: "2 حمام"
  const bathsMatch = text.match(/(\d+)\s*(?:حمام|bathroom|bath)/i);
  if (bathsMatch) {
    result.baths = parseInt(bathsMatch[1]);
    hits++;
  }

  // Price: "2.5 مليون", "2,500,000", "2500000 جنيه"
  const priceMatch = text.match(/(\d[\d,.]*)\s*(?:مليون|million)/i);
  if (priceMatch) {
    result.price = Math.round(parseFloat(normalizeNumber(priceMatch[1]).replace(/,/g, "")) * 1_000_000);
    hits++;
  } else {
    const priceMatch2 = text.match(/(\d[\d,.]+)\s*(?:جنيه|egp|ج\.م|£)/i);
    if (priceMatch2) {
      result.price = Math.round(parseFloat(normalizeNumber(priceMatch2[1]).replace(/,/g, "")));
      hits++;
    }
  }

  // Floor
  const floorMatch = text.match(/(?:الدور|دور|طابق|floor)\s+(\S+)/i);
  if (floorMatch) {
    const floorWord = floorMatch[1];
    const floorNum = FLOOR_NUMBERS[floorWord];
    if (floorNum !== undefined) {
      result.floor = floorNum;
      result.floorText = floorWord;
    } else {
      const numMatch = normalizeNumber(floorWord).match(/\d+/);
      if (numMatch) result.floor = parseInt(numMatch[0]);
    }
    hits++;
  }

  // Finishing
  for (const { pattern, value } of FINISHING_PATTERNS) {
    if (pattern.test(text)) {
      result.finishing = value;
      hits++;
      break;
    }
  }

  // View
  for (const { pattern, value } of VIEW_PATTERNS) {
    if (pattern.test(text)) {
      result.view = value;
      hits++;
      break;
    }
  }

  // Region
  for (const { pattern, id, name } of REGION_PATTERNS) {
    if (pattern.test(text)) {
      result.regionId = id;
      result.regionName = name;
      hits++;
      break;
    }
  }

  // Layout string
  if (result.beds || result.baths) {
    const parts: string[] = [];
    if (result.beds) parts.push(`${result.beds} غرف`);
    if (result.baths) parts.push(`${result.baths} حمام`);
    result.layout = parts.join(" + ");
  }

  result.confidence = Math.min(1, hits / total);
  return result;
}
