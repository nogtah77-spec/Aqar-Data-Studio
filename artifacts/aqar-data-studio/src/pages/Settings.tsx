import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES, DEFAULT_CURRENCY, getCurrencyCountry, getCurrencyLabel, getCurrencyOption } from "@/lib/currencies";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, ChevronsUpDown, Save, Loader2, Settings as SettingsIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";
import {
  AE, AU, BH, BR, CA, CH, CN, DJ, DK, DZ, EG, EU, GB, HK, ID, IL, IN,
  IQ, JO, JP, KE, KM, KR, KW, LB, LY, MA, MR, MX, MY, NG, NO, NZ, OM, PL,
  PS, QA, RU, SA, SD, SE, SG, SO, SY, TH, TN, TR, US, VN, YE, ZA,
} from "country-flag-icons/react/3x2";
import { getCurrencyCountryCode } from "@/lib/currencies";

type FlagComponent = ComponentType<any>;

const FLAG_COMPONENTS: Record<string, FlagComponent> = {
  AE, AU, BH, BR, CA, CH, CN, DJ, DK, DZ, EG, EU, GB, HK, ID, IL, IN,
  IQ, JO, JP, KE, KM, KR, KW, LB, LY, MA, MR, MX, MY, NG, NO, NZ, OM, PL,
  PS, QA, RU, SA, SD, SE, SG, SO, SY, TH, TN, TR, US, VN, YE, ZA,
};

export default function Settings() {
  const { t, language } = useLanguage();
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: ['settings'] } });
  const updateMutation = useUpdateSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
     currency: DEFAULT_CURRENCY,
    language: "ar",
    dateFormat: "DD/MM/YYYY"
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || "",
         currency: settings.currency || DEFAULT_CURRENCY,
        language: settings.language || "ar",
        dateFormat: settings.dateFormat || "DD/MM/YYYY"
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ data: formData }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(["settings"], updated);
        toast({ title: t("settings.saved"), description: language === "ar" ? "تم تطبيق التغييرات فورًا." : "Changes were applied immediately." });
      },
      onError: (error) => {
        toast({ title: t("settings.saveError"), description: error.message, variant: "destructive" });
      },
    });
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-6 p-4">
      <div className="h-8 bg-muted rounded w-48 mb-6" />
      <div className="h-64 bg-card rounded-xl border border-card-border" />
    </div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <SettingsIcon size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h2>
          <p className="text-muted-foreground text-sm">{t("settings.subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.companyData")}</CardTitle>
            <CardDescription>{t("settings.companyDataDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("settings.companyName")}</label>
                <Input 
                  value={formData.companyName} 
                  onChange={e => setFormData({...formData, companyName: e.target.value})} 
                   placeholder={language === "ar" ? "مثال: استوديو بيانات عقار" : "Example: Aqar Data Studio"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("settings.defaultCurrency")}</label>
                  <Popover open={currencyPickerOpen} onOpenChange={setCurrencyPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={currencyPickerOpen}
                        className="h-auto min-h-10 w-full justify-between gap-3 px-3 py-2 text-start"
                      >
                        <CurrencyOptionRow code={formData.currency} language={language} />
                        <ChevronsUpDown size={16} className="shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[min(420px,calc(100vw-2rem))] p-0">
                      <Command>
                        <CommandInput placeholder={language === "ar" ? "ابحث بالدولة أو العملة أو الرمز…" : "Search country, currency, or code…"} />
                        <CommandList>
                          <CommandEmpty>{language === "ar" ? "لا توجد عملة مطابقة." : "No matching currency."}</CommandEmpty>
                          {CURRENCIES.map((currency) => (
                            <CommandItem
                              key={currency.code}
                              value={`${currency.code} ${currency.currencyAr} ${currency.currencyEn} ${currency.countryAr} ${currency.countryEn}`}
                              onSelect={() => {
                                setFormData({ ...formData, currency: currency.code });
                                setCurrencyPickerOpen(false);
                              }}
                              className="py-2.5"
                            >
                              <CurrencyOptionRow code={currency.code} language={language} />
                              <Check
                                size={16}
                                className={cn("ms-auto shrink-0", formData.currency === currency.code ? "opacity-100" : "opacity-0")}
                              />
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">{t("settings.currencyHint")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.regionalPreferences")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-sm font-medium text-foreground">{t("settings.primaryLanguage")}</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.language}
                  onChange={e => setFormData({...formData, language: e.target.value})}
                >
                   <option value="ar">العربية</option>
                   <option value="en">English</option>
                </select>
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium text-foreground">{t("settings.dateFormat")}</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.dateFormat}
                  onChange={e => setFormData({...formData, dateFormat: e.target.value})}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
            {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
             {language === "ar" ? "حفظ التغييرات" : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function CurrencyOptionRow({ code, language }: { code: string; language: "ar" | "en" }) {
  const currency = getCurrencyOption(code);
  const Flag = FLAG_COMPONENTS[getCurrencyCountryCode(currency.code)];
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="inline-flex h-5 w-[1.875rem] shrink-0 aspect-[3/2] overflow-hidden rounded-sm border border-border/70 bg-muted" aria-label={getCurrencyCountry(currency.code, language)}>
        {Flag ? <Flag className="!block !h-full !w-full" aria-hidden="true" /> : <span className="flex h-full w-full items-center justify-center text-[9px] font-semibold">{currency.code}</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {getCurrencyCountry(currency.code, language)}
          <span className="mx-1 text-muted-foreground">·</span>
          {getCurrencyLabel(currency.code, language)}
        </span>
        <span className="block text-xs text-muted-foreground">
          {currency.code} <span className="mx-1">·</span> {currency.symbol}
        </span>
      </span>
    </span>
  );
}
