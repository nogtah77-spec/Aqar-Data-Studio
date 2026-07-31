export interface CurrencyOption {
  code: string;
  label: string;
  flag: string;
  symbol: string;
}

/**
 * The country/region flag is kept with each currency so the settings picker
 * remains easy to scan for currencies with similar names or shared usage.
 */
const ARAB_CURRENCIES_LIST: CurrencyOption[] = [
  { code: "DZD", label: "دينار جزائري", flag: "🇩🇿", symbol: "دج" },
  { code: "BHD", label: "دينار بحريني", flag: "🇧🇭", symbol: "د.ب" },
  { code: "KMF", label: "فرنك قمري", flag: "🇰🇲", symbol: "CF" },
  { code: "DJF", label: "فرنك جيبوتي", flag: "🇩🇯", symbol: "ف.ج" },
  { code: "EGP", label: "جنيه مصري", flag: "🇪🇬", symbol: "ج.م" },
  { code: "IQD", label: "دينار عراقي", flag: "🇮🇶", symbol: "ع.د" },
  { code: "JOD", label: "دينار أردني", flag: "🇯🇴", symbol: "د.أ" },
  { code: "KWD", label: "دينار كويتي", flag: "🇰🇼", symbol: "د.ك" },
  { code: "LBP", label: "ليرة لبنانية", flag: "🇱🇧", symbol: "ل.ل" },
  { code: "LYD", label: "دينار ليبي", flag: "🇱🇾", symbol: "د.ل" },
  { code: "MRU", label: "أوقية موريتانية", flag: "🇲🇷", symbol: "أ.م" },
  { code: "MAD", label: "درهم مغربي", flag: "🇲🇦", symbol: "د.م" },
  { code: "OMR", label: "ريال عماني", flag: "🇴🇲", symbol: "ر.ع" },
  { code: "ILS", label: "شيكل فلسطيني", flag: "🇵🇸", symbol: "₪" },
  { code: "QAR", label: "ريال قطري", flag: "🇶🇦", symbol: "ر.ق" },
  { code: "SAR", label: "ريال سعودي", flag: "🇸🇦", symbol: "ر.س" },
  { code: "SOS", label: "شلن صومالي", flag: "🇸🇴", symbol: "ش.ص" },
  { code: "SDG", label: "جنيه سوداني", flag: "🇸🇩", symbol: "ج.س" },
  { code: "SYP", label: "ليرة سورية", flag: "🇸🇾", symbol: "ل.س" },
  { code: "TND", label: "دينار تونسي", flag: "🇹🇳", symbol: "د.ت" },
  { code: "AED", label: "درهم إماراتي", flag: "🇦🇪", symbol: "د.إ" },
  { code: "YER", label: "ريال يمني", flag: "🇾🇪", symbol: "ر.ي" },
];

const GLOBAL_CURRENCIES: CurrencyOption[] = [
  { code: "USD", label: "دولار أمريكي", flag: "🇺🇸", symbol: "$" },
  { code: "EUR", label: "يورو", flag: "🇪🇺", symbol: "€" },
  { code: "GBP", label: "جنيه إسترليني", flag: "🇬🇧", symbol: "£" },
  { code: "CHF", label: "فرنك سويسري", flag: "🇨🇭", symbol: "CHF" },
  { code: "CAD", label: "دولار كندي", flag: "🇨🇦", symbol: "CA$" },
  { code: "AUD", label: "دولار أسترالي", flag: "🇦🇺", symbol: "A$" },
  { code: "JPY", label: "ين ياباني", flag: "🇯🇵", symbol: "¥" },
  { code: "CNY", label: "يوان صيني", flag: "🇨🇳", symbol: "¥" },
  { code: "INR", label: "روبية هندية", flag: "🇮🇳", symbol: "₹" },
  { code: "TRY", label: "ليرة تركية", flag: "🇹🇷", symbol: "₺" },
  { code: "RUB", label: "روبل روسي", flag: "🇷🇺", symbol: "₽" },
  { code: "BRL", label: "ريال برازيلي", flag: "🇧🇷", symbol: "R$" },
  { code: "ZAR", label: "راند جنوب أفريقي", flag: "🇿🇦", symbol: "R" },
  { code: "MXN", label: "بيزو مكسيكي", flag: "🇲🇽", symbol: "MX$" },
  { code: "SGD", label: "دولار سنغافوري", flag: "🇸🇬", symbol: "S$" },
  { code: "HKD", label: "دولار هونغ كونغ", flag: "🇭🇰", symbol: "HK$" },
  { code: "SEK", label: "كرونة سويدية", flag: "🇸🇪", symbol: "kr" },
  { code: "NOK", label: "كرونة نرويجية", flag: "🇳🇴", symbol: "kr" },
  { code: "DKK", label: "كرونة دنماركية", flag: "🇩🇰", symbol: "kr" },
  { code: "NZD", label: "دولار نيوزيلندي", flag: "🇳🇿", symbol: "NZ$" },
];

export const ARAB_CURRENCIES: CurrencyOption[] = [
  ...ARAB_CURRENCIES_LIST,
];

export const CURRENCIES: CurrencyOption[] = [
  ...GLOBAL_CURRENCIES,
  ...ARAB_CURRENCIES_LIST,
];

export const DEFAULT_CURRENCY = "EGP";

export function getCurrencyOption(code?: string | null): CurrencyOption {
  return CURRENCIES.find((currency) => currency.code === code) ??
    CURRENCIES.find((currency) => currency.code === DEFAULT_CURRENCY)!;
}