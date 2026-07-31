export interface CurrencyOption {
  code: string;
  /** Kept for compatibility with existing consumers; this is the Arabic currency name. */
  label: string;
  flag: string;
  symbol: string;
  countryAr: string;
  countryEn: string;
  currencyAr: string;
  currencyEn: string;
}

type CurrencySeed = Omit<CurrencyOption, "label"> & { currencyAr: string };

const ARAB_CURRENCIES_LIST: CurrencySeed[] = [
  { code: "DZD", flag: "🇩🇿", symbol: "دج", countryAr: "الجزائر", countryEn: "Algeria", currencyAr: "دينار جزائري", currencyEn: "Algerian dinar" },
  { code: "BHD", flag: "🇧🇭", symbol: "د.ب", countryAr: "البحرين", countryEn: "Bahrain", currencyAr: "دينار بحريني", currencyEn: "Bahraini dinar" },
  { code: "KMF", flag: "🇰🇲", symbol: "CF", countryAr: "جزر القمر", countryEn: "Comoros", currencyAr: "فرنك قمري", currencyEn: "Comorian franc" },
  { code: "DJF", flag: "🇩🇯", symbol: "ف.ج", countryAr: "جيبوتي", countryEn: "Djibouti", currencyAr: "فرنك جيبوتي", currencyEn: "Djiboutian franc" },
  { code: "EGP", flag: "🇪🇬", symbol: "ج.م", countryAr: "مصر", countryEn: "Egypt", currencyAr: "جنيه مصري", currencyEn: "Egyptian pound" },
  { code: "IQD", flag: "🇮🇶", symbol: "ع.د", countryAr: "العراق", countryEn: "Iraq", currencyAr: "دينار عراقي", currencyEn: "Iraqi dinar" },
  { code: "JOD", flag: "🇯🇴", symbol: "د.أ", countryAr: "الأردن", countryEn: "Jordan", currencyAr: "دينار أردني", currencyEn: "Jordanian dinar" },
  { code: "KWD", flag: "🇰🇼", symbol: "د.ك", countryAr: "الكويت", countryEn: "Kuwait", currencyAr: "دينار كويتي", currencyEn: "Kuwaiti dinar" },
  { code: "LBP", flag: "🇱🇧", symbol: "ل.ل", countryAr: "لبنان", countryEn: "Lebanon", currencyAr: "ليرة لبنانية", currencyEn: "Lebanese pound" },
  { code: "LYD", flag: "🇱🇾", symbol: "د.ل", countryAr: "ليبيا", countryEn: "Libya", currencyAr: "دينار ليبي", currencyEn: "Libyan dinar" },
  { code: "MRU", flag: "🇲🇷", symbol: "أ.م", countryAr: "موريتانيا", countryEn: "Mauritania", currencyAr: "أوقية موريتانية", currencyEn: "Mauritanian ouguiya" },
  { code: "MAD", flag: "🇲🇦", symbol: "د.م", countryAr: "المغرب", countryEn: "Morocco", currencyAr: "درهم مغربي", currencyEn: "Moroccan dirham" },
  { code: "OMR", flag: "🇴🇲", symbol: "ر.ع", countryAr: "عُمان", countryEn: "Oman", currencyAr: "ريال عماني", currencyEn: "Omani rial" },
  { code: "ILS", flag: "🇵🇸", symbol: "₪", countryAr: "فلسطين", countryEn: "Palestine", currencyAr: "شيكل فلسطيني", currencyEn: "Israeli new shekel" },
  { code: "QAR", flag: "🇶🇦", symbol: "ر.ق", countryAr: "قطر", countryEn: "Qatar", currencyAr: "ريال قطري", currencyEn: "Qatari riyal" },
  { code: "SAR", flag: "🇸🇦", symbol: "ر.س", countryAr: "السعودية", countryEn: "Saudi Arabia", currencyAr: "ريال سعودي", currencyEn: "Saudi riyal" },
  { code: "SOS", flag: "🇸🇴", symbol: "ش.ص", countryAr: "الصومال", countryEn: "Somalia", currencyAr: "شلن صومالي", currencyEn: "Somali shilling" },
  { code: "SDG", flag: "🇸🇩", symbol: "ج.س", countryAr: "السودان", countryEn: "Sudan", currencyAr: "جنيه سوداني", currencyEn: "Sudanese pound" },
  { code: "SYP", flag: "🇸🇾", symbol: "ل.س", countryAr: "سوريا", countryEn: "Syria", currencyAr: "ليرة سورية", currencyEn: "Syrian pound" },
  { code: "TND", flag: "🇹🇳", symbol: "د.ت", countryAr: "تونس", countryEn: "Tunisia", currencyAr: "دينار تونسي", currencyEn: "Tunisian dinar" },
  { code: "AED", flag: "🇦🇪", symbol: "د.إ", countryAr: "الإمارات", countryEn: "United Arab Emirates", currencyAr: "درهم إماراتي", currencyEn: "UAE dirham" },
  { code: "YER", flag: "🇾🇪", symbol: "ر.ي", countryAr: "اليمن", countryEn: "Yemen", currencyAr: "ريال يمني", currencyEn: "Yemeni rial" },
];

const GLOBAL_CURRENCIES: CurrencySeed[] = [
  { code: "USD", flag: "🇺🇸", symbol: "$", countryAr: "الولايات المتحدة", countryEn: "United States", currencyAr: "دولار أمريكي", currencyEn: "US dollar" },
  { code: "EUR", flag: "🇪🇺", symbol: "€", countryAr: "منطقة اليورو", countryEn: "Eurozone", currencyAr: "يورو", currencyEn: "Euro" },
  { code: "GBP", flag: "🇬🇧", symbol: "£", countryAr: "المملكة المتحدة", countryEn: "United Kingdom", currencyAr: "جنيه إسترليني", currencyEn: "British pound" },
  { code: "CHF", flag: "🇨🇭", symbol: "CHF", countryAr: "سويسرا", countryEn: "Switzerland", currencyAr: "فرنك سويسري", currencyEn: "Swiss franc" },
  { code: "CAD", flag: "🇨🇦", symbol: "CA$", countryAr: "كندا", countryEn: "Canada", currencyAr: "دولار كندي", currencyEn: "Canadian dollar" },
  { code: "AUD", flag: "🇦🇺", symbol: "A$", countryAr: "أستراليا", countryEn: "Australia", currencyAr: "دولار أسترالي", currencyEn: "Australian dollar" },
  { code: "JPY", flag: "🇯🇵", symbol: "¥", countryAr: "اليابان", countryEn: "Japan", currencyAr: "ين ياباني", currencyEn: "Japanese yen" },
  { code: "CNY", flag: "🇨🇳", symbol: "¥", countryAr: "الصين", countryEn: "China", currencyAr: "يوان صيني", currencyEn: "Chinese yuan" },
  { code: "INR", flag: "🇮🇳", symbol: "₹", countryAr: "الهند", countryEn: "India", currencyAr: "روبية هندية", currencyEn: "Indian rupee" },
  { code: "TRY", flag: "🇹🇷", symbol: "₺", countryAr: "تركيا", countryEn: "Turkey", currencyAr: "ليرة تركية", currencyEn: "Turkish lira" },
  { code: "RUB", flag: "🇷🇺", symbol: "₽", countryAr: "روسيا", countryEn: "Russia", currencyAr: "روبل روسي", currencyEn: "Russian ruble" },
  { code: "BRL", flag: "🇧🇷", symbol: "R$", countryAr: "البرازيل", countryEn: "Brazil", currencyAr: "ريال برازيلي", currencyEn: "Brazilian real" },
  { code: "ZAR", flag: "🇿🇦", symbol: "R", countryAr: "جنوب أفريقيا", countryEn: "South Africa", currencyAr: "راند جنوب أفريقي", currencyEn: "South African rand" },
  { code: "MXN", flag: "🇲🇽", symbol: "MX$", countryAr: "المكسيك", countryEn: "Mexico", currencyAr: "بيزو مكسيكي", currencyEn: "Mexican peso" },
  { code: "SGD", flag: "🇸🇬", symbol: "S$", countryAr: "سنغافورة", countryEn: "Singapore", currencyAr: "دولار سنغافوري", currencyEn: "Singapore dollar" },
  { code: "HKD", flag: "🇭🇰", symbol: "HK$", countryAr: "هونغ كونغ", countryEn: "Hong Kong", currencyAr: "دولار هونغ كونغ", currencyEn: "Hong Kong dollar" },
  { code: "SEK", flag: "🇸🇪", symbol: "kr", countryAr: "السويد", countryEn: "Sweden", currencyAr: "كرونة سويدية", currencyEn: "Swedish krona" },
  { code: "NOK", flag: "🇳🇴", symbol: "kr", countryAr: "النرويج", countryEn: "Norway", currencyAr: "كرونة نرويجية", currencyEn: "Norwegian krone" },
  { code: "DKK", flag: "🇩🇰", symbol: "kr", countryAr: "الدنمارك", countryEn: "Denmark", currencyAr: "كرونة دنماركية", currencyEn: "Danish krone" },
  { code: "NZD", flag: "🇳🇿", symbol: "NZ$", countryAr: "نيوزيلندا", countryEn: "New Zealand", currencyAr: "دولار نيوزيلندي", currencyEn: "New Zealand dollar" },
  { code: "PLN", flag: "🇵🇱", symbol: "zł", countryAr: "بولندا", countryEn: "Poland", currencyAr: "زلوتي بولندي", currencyEn: "Polish zloty" },
  { code: "KRW", flag: "🇰🇷", symbol: "₩", countryAr: "كوريا الجنوبية", countryEn: "South Korea", currencyAr: "وون كوري جنوبي", currencyEn: "South Korean won" },
  { code: "THB", flag: "🇹🇭", symbol: "฿", countryAr: "تايلاند", countryEn: "Thailand", currencyAr: "بات تايلاندي", currencyEn: "Thai baht" },
  { code: "IDR", flag: "🇮🇩", symbol: "Rp", countryAr: "إندونيسيا", countryEn: "Indonesia", currencyAr: "روبية إندونيسية", currencyEn: "Indonesian rupiah" },
  { code: "MYR", flag: "🇲🇾", symbol: "RM", countryAr: "ماليزيا", countryEn: "Malaysia", currencyAr: "رينغيت ماليزي", currencyEn: "Malaysian ringgit" },
  { code: "VND", flag: "🇻🇳", symbol: "₫", countryAr: "فيتنام", countryEn: "Vietnam", currencyAr: "دونغ فيتنامي", currencyEn: "Vietnamese dong" },
  { code: "NGN", flag: "🇳🇬", symbol: "₦", countryAr: "نيجيريا", countryEn: "Nigeria", currencyAr: "نايرا نيجيرية", currencyEn: "Nigerian naira" },
];

function createCurrencyOption(seed: CurrencySeed): CurrencyOption {
  return { ...seed, label: seed.currencyAr };
}

export const ARAB_CURRENCIES: CurrencyOption[] = ARAB_CURRENCIES_LIST.map(createCurrencyOption);
export const CURRENCIES: CurrencyOption[] = [
  ...GLOBAL_CURRENCIES.map(createCurrencyOption),
  ...ARAB_CURRENCIES,
];

export const DEFAULT_CURRENCY = "EGP";

export function getCurrencyOption(code?: string | null): CurrencyOption {
  return CURRENCIES.find((currency) => currency.code === code) ??
    CURRENCIES.find((currency) => currency.code === DEFAULT_CURRENCY)!;
}

export function getCurrencyLabel(code: string | null | undefined, language: "ar" | "en" = "ar") {
  const currency = getCurrencyOption(code);
  return language === "ar" ? currency.currencyAr : currency.currencyEn;
}

export function getCurrencyCountry(code: string | null | undefined, language: "ar" | "en" = "ar") {
  const currency = getCurrencyOption(code);
  return language === "ar" ? currency.countryAr : currency.countryEn;
}