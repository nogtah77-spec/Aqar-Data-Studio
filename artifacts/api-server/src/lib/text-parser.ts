/**
 * Deterministic smart property parser for Arabic and English listing text.
 *
 * The parser deliberately returns normalized values for form fields and keeps
 * human-readable residual text separate so extracted facts are not duplicated
 * in the description.
 */

export interface ParsedPropertyFields {
  area?: number;
  beds?: number;
  baths?: number;
  floors?: number;
  price?: number;
  priceFormatted?: string;
  currency?: string;
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
  master?: string;
  elevator?: string;
  location?: string;
  parking?: string;
  furnished?: string;
  amenities?: string[];
  additionalDetails?: string[];
  source?: string;
  sourcePhones?: string[];
  sourceEmail?: string;
  externalUrl?: string;
  description?: string;
  confidence: number;
}

const ARABIC_TO_WESTERN: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

function normalizeText(value: string): string {
  return value
    .replace(/[٠-٩۰-۹]/g, (char) => ARABIC_TO_WESTERN[char] ?? char)
    .replace(/٬/g, ",")
    .replace(/٫/g, ".")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const NUMBER_WORDS: Record<string, number> = {
  "صفر": 0, "واحد": 1, "واحده": 1, "اول": 1,
  "اثنان": 2, "اثنين": 2, "اتنين": 2, "اثنتان": 2, "اثنتين": 2,
  "ثلاث": 3, "ثلاثه": 3, "ثلاثة": 3, "تلاته": 3,
  "اربع": 4, "اربعه": 4, "أربع": 4, "أربعة": 4,
  "خمس": 5, "خمسه": 5, "خمسة": 5,
  "ست": 6, "سته": 6, "ستة": 6,
  "سبع": 7, "سبعه": 7, "سبعة": 7,
  "ثمان": 8, "ثمانيه": 8, "ثمانية": 8,
  "تسع": 9, "تسعه": 9, "تسعة": 9,
  "عشر": 10, "عشره": 10, "عشرة": 10,
  "first": 1, "second": 2, "third": 3, "fourth": 4,
  "fifth": 5, "sixth": 6, "seventh": 7, "eighth": 8,
  "ninth": 9, "tenth": 10, "ground": 0, "top": 99,
};

function parseNumber(value: string): number | undefined {
  const normalized = normalizeText(value).replace(/\s/g, "");
  const compactGroups = normalized.match(/^\d{1,3}(?:[,.]\d{3})+$/);
  if (compactGroups) {
    const compact = normalized.replace(/[,.]/g, "");
    return Number(compact);
  }

  const separators = normalized.match(/[,.]/g) ?? [];
  let numeric = normalized;
  if (separators.length > 1) {
    const last = normalized.lastIndexOf(separators[separators.length - 1]);
    const decimals = normalized.length - last - 1;
    numeric = decimals === 1 || decimals === 2
      ? normalized.slice(0, last).replace(/[,.]/g, "") + "." + normalized.slice(last + 1)
      : normalized.replace(/[,.]/g, "");
  } else if (separators[0] === ",") {
    numeric = normalized.endsWith(",") || normalized.split(",")[1]?.length === 3
      ? normalized.replace(",", "")
      : normalized.replace(",", ".");
  }

  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNumberOrWord(value: string): number | undefined {
  const numeric = parseNumber(value);
  if (numeric !== undefined) return numeric;
  const normalized = normalizeText(value);
  return NUMBER_WORDS[normalized] ?? NUMBER_WORDS[normalized.replace(/^ال/, "")];
}

function formatPrice(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

const FLOOR_NUMBERS: Record<string, number> = {
  "ارضي": 0, "ground": 0, "اول": 1, "first": 1, "ثاني": 2, "second": 2,
  "ثالث": 3, "third": 3, "رابع": 4, "fourth": 4, "خامس": 5, "fifth": 5,
  "سادس": 6, "sixth": 6, "سابع": 7, "seventh": 7, "ثامن": 8, "eighth": 8,
  "تاسع": 9, "ninth": 9, "عاشر": 10, "tenth": 10, "اخير": 99, "top": 99,
};

const FINISHING_PATTERNS: { pattern: RegExp; value: string }[] = [
  { pattern: /الترا سوبر لوكس|ultra super lux/, value: "ألترا سوبر لوكس" },
  { pattern: /سوبر لوكس|super lux|superlux/, value: "سوبر لوكس" },
  { pattern: /نص تشطيب|نصف تشطيب|semi.?finish/, value: "نص تشطيب" },
  { pattern: /تشطيب 75|75\s*%/, value: "تشطيب 75%" },
  { pattern: /تشطيب 50|50\s*%/, value: "تشطيب 50%" },
  { pattern: /طوب احمر|red brick/, value: "طوب أحمر" },
  { pattern: /تحت الانشاء|under construction/, value: "تحت الإنشاء" },
  { pattern: /متشطب|مشطب|تشطيب كامل|fully finished/, value: "متشطب" },
];

const VIEW_PATTERNS: { pattern: RegExp; value: string }[] = [
  { pattern: /بحري|sea.?view|sea view|north facing/, value: "بحري" },
  { pattern: /قبلي|south facing/, value: "قبلي" },
  { pattern: /حديقه|garden/, value: "حديقة" },
  { pattern: /على الشارع|شارع رئيسي|main street/, value: "شارع رئيسي" },
  { pattern: /داخلي|internal view/, value: "داخلي" },
  { pattern: /2 شوارع|شارعين|two streets/, value: "شارعين" },
  { pattern: /3 شوارع|ثلاث شوارع|three streets/, value: "3 شوارع" },
];

const REGION_PATTERNS: { pattern: RegExp; id: string; name: string }[] = [
  { pattern: /شروق|shorouk/, id: "shorouk", name: "مدينة الشروق" },
  { pattern: /مدينتي|madinaty/, id: "madinaty", name: "مدينتي" },
  { pattern: /مدينه بدر|badr/, id: "badr", name: "مدينة بدر" },
  { pattern: /وصال|wasal/, id: "wasal", name: "كمباوند وصال" },
  { pattern: /التجمع|تجمع|tagamoa|new cairo/, id: "tagamoa", name: "التجمع" },
  { pattern: /بيت الوطن|beit el watan/, id: "beit_elwatan", name: "بيت الوطن" },
  { pattern: /الرحاب|رحاب|rehab/, id: "rehab", name: "الرحاب" },
  { pattern: /العاصمه الاداريه|عاصمه|new.?capital/, id: "new_capital", name: "العاصمة الإدارية الجديدة" },
  { pattern: /مدينه نصر|nasr city/, id: "nasr_city", name: "مدينة نصر" },
  { pattern: /المهندسين|mohandeseen/, id: "mohandeseen", name: "المهندسين" },
  { pattern: /الشيخ زايد|زايد|sheikh.?zayed/, id: "sheikh_zayed", name: "الشيخ زايد" },
  { pattern: /6 اكتوبر|october|6th of october/, id: "oct6", name: "6 أكتوبر" },
];

const UNIT_TYPE_PATTERNS: { pattern: RegExp; value: string }[] = [
  { pattern: /شقه|apartment|flat/, value: "apartment" },
  { pattern: /دوبلكس|duplex/, value: "duplex" },
  { pattern: /فيلا|villa/, value: "villa" },
  { pattern: /بنت هاوس|penthouse/, value: "penthouse" },
  { pattern: /تاون هاوس|townhouse/, value: "townhouse" },
  { pattern: /توين هاوس|twinhouse/, value: "twinhouse" },
  { pattern: /ستوديو|استوديو|studio/, value: "studio" },
  { pattern: /محل|shop|store/, value: "shop" },
  { pattern: /مكتب|office/, value: "office" },
  { pattern: /عياده|clinic/, value: "clinic" },
  { pattern: /ارض|land|plot/, value: "land" },
];

const CURRENCY_PATTERNS: { pattern: RegExp; code: string }[] = [
  { pattern: /جنيه مصري|جنيه|ج\.م|egp|egyptian pound/, code: "EGP" },
  { pattern: /ريال سعودي|ر\.س|sar|saudi riyal/, code: "SAR" },
  { pattern: /ريال يمني|ر\.ي|yer|yemeni rial/, code: "YER" },
  { pattern: /ريال قطري|ر\.ق|qar|qatari riyal/, code: "QAR" },
  { pattern: /ريال عماني|ر\.ع|omr|omani rial/, code: "OMR" },
  { pattern: /ريال|rial|riyal/, code: "SAR" },
  { pattern: /درهم اماراتي|درهم|د\.ا|aed|emirati dirham/, code: "AED" },
  { pattern: /دينار كويتي|د\.ك|kwd|kuwaiti dinar/, code: "KWD" },
  { pattern: /دينار اردني|jod|jordanian dinar/, code: "JOD" },
  { pattern: /دولار|usd|dollar/, code: "USD" },
  { pattern: /يورو|eur|euro/, code: "EUR" },
  { pattern: /جنيه استرليني|gbp|pound/, code: "GBP" },
];

const AMENITY_PATTERNS: { pattern: RegExp; value: string }[] = [
  { pattern: /ماستر|master bedroom|master/, value: "غرفة ماستر" },
  { pattern: /اسانسير|مصعد|elevator|lift/, value: "مصعد" },
  { pattern: /جراج|باركينج|parking|garage/, value: "جراج" },
  { pattern: /مفروش|furnished/, value: "مفروش" },
  { pattern: /غير مفروش|unfurnished/, value: "غير مفروش" },
  { pattern: /تكييف|مكيف|air.?condition/, value: "تكييف" },
  { pattern: /امن|حراسة|security|gated/, value: "أمن وحراسة" },
  { pattern: /حمام سباحه|حمام سباحة|swimming pool|pool/, value: "حمام سباحة" },
  { pattern: /بلكونه|شرفه|balcony|terrace/, value: "شرفة" },
  { pattern: /مطبخ|kitchen/, value: "مطبخ" },
  { pattern: /روف|roof|rooftop/, value: "روف" },
  { pattern: /جنينه|حديقة خاصه|private garden/, value: "حديقة خاصة" },
];

const NUMBER_TOKEN = "[0-9][0-9\\s,.]*";
const NUMBER_OR_WORD_TOKEN = `${NUMBER_TOKEN}|[\\u0600-\\u06ff]+|[a-z]+`;

function firstNumber(text: string, expression: RegExp): number | undefined {
  const match = text.match(expression);
  return match ? parseNumberOrWord(match[1]) : undefined;
}

function cleanResidual(text: string, patterns: RegExp[]): string {
  let residual = text;
  for (const pattern of patterns) residual = residual.replace(pattern, " ");
  residual = residual
    .replace(/https?:\/\/[^\s،,؛;]+/gi, " ")
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, " ")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, " ")
    .replace(/(?:هاتف|تليفون|موبايل|البريد|والبريد|phone|mobile|email)/gi, " ")
    .replace(/\b(?:for|sale|rent|in|at|on|and|with|from|the|a|an|view|price|asking|starting)\b/gi, " ")
    .replace(/(?:للبيع|للايجار|للإيجار|بسعر|السعر|سعر|جنيه|ريال|درهم|دينار|دولار|يورو|مليون|ملايين|الف|ألف|مصري|سعودي|يمني|قطري|اماراتي|كويتي|اردني)/gi, " ")
    .replace(/(?:في|و|من|على|ب|ال)\s+/g, " ");
  return residual
    .replace(/\s*[,،;؛|]+\s*/g, "، ")
    .replace(/\s+/g, " ")
    .replace(/^(?:و|وصف|description|تفاصيل)\s+/i, "")
    .replace(/(?:،\s*){2,}/g, "، ")
    .trim()
    .replace(/^[،.\s]+|[،.\s]+$/g, "");
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function parsePropertyText(text: string): ParsedPropertyFields {
  const source = String(text ?? "").trim();
  const norm = normalizeText(source);
  const result: ParsedPropertyFields = { confidence: 0 };
  const consumed: RegExp[] = [];
  let hits = 0;

  const area = firstNumber(norm, new RegExp(`(${NUMBER_OR_WORD_TOKEN})\\s*(?:متر|م2|م²|م|sqm|m²|square meters?|مساحه)`, "i"))
    ?? firstNumber(norm, new RegExp(`(${NUMBER_OR_WORD_TOKEN})\\s*(?:sq\\.?\\s*ft|sqft|square feet?|ft²)`, "i"))
    ?? firstNumber(norm, new RegExp(`(?:مساحه|area)\\s*[:：-]?\\s*(${NUMBER_OR_WORD_TOKEN})`, "i"));
  if (area !== undefined && area > 0) {
    result.area = Math.round(area);
    hits++;
    consumed.push(new RegExp(`${NUMBER_TOKEN}\\s*(?:متر|م2|م²|م(?!ليون|تر)|sqm|m²|square meters?|مساحه|sq\\.?\\s*ft|sqft|square feet?|ft²)`, "ig"));
  }

  const beds = firstNumber(norm, new RegExp(`(${NUMBER_OR_WORD_TOKEN})\\s*(?:غرفه?|غرف|bedrooms?|beds?|br)`, "i"));
  if (beds !== undefined) {
    result.beds = Math.round(beds);
    hits++;
    consumed.push(new RegExp(`${NUMBER_TOKEN}\\s*(?:غرفه?|غرف|bedrooms?|beds?|br)`, "ig"));
  }

  const baths = firstNumber(norm, new RegExp(`(${NUMBER_OR_WORD_TOKEN})\\s*(?:حمامات|حمام|bathrooms?|baths?|ba)`, "i"));
  if (baths !== undefined) {
    result.baths = Math.round(baths);
    hits++;
    consumed.push(new RegExp(`${NUMBER_TOKEN}\\s*(?:حمامات|حمام|bathrooms?|baths?|ba)`, "ig"));
  }

  const floorMatch = norm.match(new RegExp(`(?:الدور|طابق|floor)\\s*[:：-]?\\s*(${NUMBER_OR_WORD_TOKEN})`, "i"));
  if (floorMatch) {
    const floorText = floorMatch[1];
    const normalizedFloorText = normalizeText(floorText);
    const floor = parseNumberOrWord(floorText)
      ?? FLOOR_NUMBERS[normalizedFloorText]
      ?? FLOOR_NUMBERS[normalizedFloorText.replace(/^ال/, "")];
    if (floor !== undefined) {
      result.floor = Math.round(floor);
      result.floorText = floorText;
      hits++;
      consumed.push(new RegExp(`(?:الدور|طابق|floor)\\s*[:：-]?\\s*${NUMBER_TOKEN}`, "ig"));
      consumed.push(new RegExp(`(?:الدور|طابق|floor)\\s*[:：-]?\\s*[\\u0600-\\u06ff]+`, "ig"));
    }
  }
  const reverseFloorMatch = norm.match(/(\d+)\s*(?:st|nd|rd|th)?\s*floor/i);
  if (!floorMatch && reverseFloorMatch) {
    result.floor = Number(reverseFloorMatch[1]);
    result.floorText = reverseFloorMatch[0];
    hits++;
    consumed.push(/\d+\s*(?:st|nd|rd|th)?\s*floor/ig);
  }

  const floorSequenceMatch = norm.match(/(?:ارضي|اول|ثاني|ثالث|رابع|ground|first|second|third|fourth)(?:\s*و\s*(?:ارضي|اول|ثاني|ثالث|رابع)|\s+and\s+(?:ground|first|second|third|fourth))+/i);
  if (!floorMatch && !reverseFloorMatch && floorSequenceMatch) {
    result.floorText = floorSequenceMatch[0];
    consumed.push(/(?:ارضي|اول|ثاني|ثالث|رابع|ground|first|second|third|fourth)(?:\s*و\s*(?:ارضي|اول|ثاني|ثالث|رابع)|\s+and\s+(?:ground|first|second|third|fourth))+/ig);
    hits++;
  }

  const floors = firstNumber(norm, new RegExp(`(${NUMBER_OR_WORD_TOKEN})\\s*(?:طوابق|ادوار|floors?)`, "i"));
  if (floors !== undefined) {
    result.floors = Math.round(floors);
    hits++;
    consumed.push(new RegExp(`${NUMBER_TOKEN}\\s*(?:طوابق|ادوار|floors?)`, "ig"));
  }

  const currency = CURRENCY_PATTERNS.find(({ pattern }) => pattern.test(norm))?.code;
  if (currency) result.currency = currency;

  const multiplierPattern = "(مليار|مليون|ملايين|الف|ألف|thousand|million|billion|k|m)";
  const currencyToken = "(?:جنيه|ريال|درهم|دينار|دولار|يورو|egp|sar|yer|aed|kwd|usd|eur)";
  const priceContext = norm.match(new RegExp(`(?:سعر|السعر|price|asking price|يبدأ من|starting from)\\s*[:：-]?\\s*${currencyToken}?\\s*(${NUMBER_TOKEN})(?:\\s*${multiplierPattern})?`, "i"));
  const pricedNumber = norm.match(new RegExp(`(${NUMBER_TOKEN})\\s*(?:${multiplierPattern}|${currencyToken})`, "i"))
    ?? norm.match(new RegExp(`${currencyToken}\\s*(${NUMBER_TOKEN})(?:\\s*${multiplierPattern})?`, "i"));
  const priceMatch = priceContext ?? pricedNumber;
  if (priceMatch) {
    const value = parseNumber(priceMatch[1]);
    const multiplier = normalizeText(priceMatch[2] ?? "");
    if (value !== undefined && value > 0) {
      const factor = multiplier === "مليار" || multiplier === "billion"
        ? 1_000_000_000
        : multiplier === "مليون" || multiplier === "ملايين" || multiplier === "million" || multiplier === "m"
          ? 1_000_000
          : multiplier === "الف" || multiplier === "ألف" || multiplier === "thousand" || multiplier === "k"
            ? 1_000
            : 1;
      result.price = Math.round(value * factor);
      result.priceFormatted = formatPrice(result.price);
      hits++;
      consumed.push(new RegExp(`(?:(?:سعر|السعر|price|asking price|يبدأ من|starting from)\\s*)?(?:${currencyToken}\\s*)?${NUMBER_TOKEN}\\s*(?:${multiplierPattern}|${currencyToken})?`, "ig"));
    }
  }

  for (const { pattern, value } of FINISHING_PATTERNS) {
    if (pattern.test(norm)) {
      result.finishing = value;
      hits++;
      consumed.push(pattern);
      break;
    }
  }

  for (const { pattern, value } of VIEW_PATTERNS) {
    if (pattern.test(norm)) {
      result.view = value;
      hits++;
      consumed.push(pattern);
      break;
    }
  }

  for (const { pattern, id, name } of REGION_PATTERNS) {
    if (pattern.test(norm)) {
      result.regionId = id;
      result.regionName = name;
      hits++;
      consumed.push(pattern);
      break;
    }
  }

  for (const { pattern, value } of UNIT_TYPE_PATTERNS) {
    if (pattern.test(norm)) {
      result.unitType = value;
      hits++;
      consumed.push(pattern);
      break;
    }
  }

  if (/للايجار|للايجار|for rent|rent/.test(norm)) {
    result.category = "rent";
    hits++;
    consumed.push(/للإ?يجار|for rent|rent/ig);
  } else if (/للبيع|for sale|sale/.test(norm)) {
    result.category = "sale";
    hits++;
    consumed.push(/للبيع|for sale|sale/ig);
  }

  const subAreaMatch = norm.match(/(?:الحي|حى|المنطقه الفرعيه|sub.?area|district)\s*[:：-]?\s*([^،,;؛|]+)/i);
  if (subAreaMatch?.[1]) {
    result.subArea = subAreaMatch[1].trim();
    hits++;
    consumed.push(new RegExp(`(?:الحي|حى|المنطقه الفرعيه|sub.?area|district)\\s*[:：-]?\\s*[^،,;؛|]+`, "ig"));
  }

  const email = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phones = unique(source.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) ?? [])
    .map((phone) => phone.replace(/[^\d+]/g, ""))
    .filter((phone) => phone.replace(/\D/g, "").length >= 8);
  const externalUrl = source.match(/https?:\/\/[^\s،,؛;]+/i)?.[0];
  if (email) { result.sourceEmail = email; hits++; }
  if (phones.length) { result.sourcePhones = phones; hits++; }
  if (externalUrl) { result.externalUrl = externalUrl; hits++; }

  const sourceMatch = source.match(/(?:المصدر|source)\s*[:：-]\s*([^،,؛;\n]+)/i);
  if (sourceMatch?.[1]) {
    result.source = sourceMatch[1].trim();
    consumed.push(/(?:المصدر|source)\s*[:：-]\s*[^،,؛;\n]+/ig);
    hits++;
  }

  const amenities: string[] = [];
  for (const { pattern, value } of AMENITY_PATTERNS) {
    if (pattern.test(norm)) {
      amenities.push(value);
      consumed.push(pattern);
    }
  }
  result.amenities = unique(amenities);
  result.master = amenities.includes("غرفة ماستر") ? "نعم" : undefined;
  result.elevator = amenities.includes("مصعد") ? "نعم" : undefined;
  result.parking = amenities.includes("جراج") ? "نعم" : undefined;
  result.furnished = amenities.includes("مفروش")
    ? "مفروش"
    : amenities.includes("غير مفروش") ? "غير مفروش" : undefined;
  if (amenities.length) hits++;

  if (result.beds !== undefined || result.baths !== undefined) {
    result.layout = [
      result.beds !== undefined ? `${result.beds} غرف` : "",
      result.baths !== undefined ? `${result.baths} حمام` : "",
    ].filter(Boolean).join(" + ");
  }

  const locationParts = [result.regionName, result.subArea].filter(Boolean);
  if (locationParts.length) result.location = locationParts.join("، ");

  const residual = cleanResidual(norm, consumed);
  const additionalDetails = unique(
    residual.split(/(?:،|,|;|؛)/).map((part) => part.trim()).filter((part) => part.length > 3)
  );
  result.additionalDetails = additionalDetails;
  result.description = additionalDetails.join("، ") || undefined;

  const extractedCount = [
    result.area, result.beds, result.baths, result.price, result.floor,
    result.finishing, result.view, result.regionId, result.unitType,
    result.category, result.subArea, result.amenities?.length,
  ].filter((value) => value !== undefined && value !== null && value !== 0).length;
  result.confidence = Math.min(1, Math.round((hits / Math.max(8, extractedCount + 3)) * 100) / 100);
  return result;
}