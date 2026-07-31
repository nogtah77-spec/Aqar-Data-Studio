import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center flex-col gap-4">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-xl text-muted-foreground">{t("notFound.title")}</p>
    </div>
  );
}
