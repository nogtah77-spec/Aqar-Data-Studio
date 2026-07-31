export interface CurrencyOption {
  code: string;
  label: string;
  flag: string;
  symbol: string;
}

/**
 * Currencies used in the Arab League member states.
 * The country flag is kept with the currency so the settings picker is
 * unambiguous for currencies that are shared or have similar names.
 */
export const ARAB_CURRENCIES: CurrencyOption[] = [
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

export const DEFAULT_CURRENCY = "EGP";

export function getCurrencyOption(code?: string | null): CurrencyOption {
  return ARAB_CURRENCIES.find((currency) => currency.code === code) ??
    ARAB_CURRENCIES.find((currency) => currency.code === DEFAULT_CURRENCY)!;
}