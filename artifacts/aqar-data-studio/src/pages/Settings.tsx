import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Loader2, Settings as SettingsIcon } from "lucide-react";
import { useState, useEffect } from "react";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: ['settings'] } });
  const updateMutation = useUpdateSettings();

  const [formData, setFormData] = useState({
    companyName: "",
    currency: "EGP",
    language: "ar",
    dateFormat: "DD/MM/YYYY"
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || "",
        currency: settings.currency || "EGP",
        language: settings.language || "ar",
        dateFormat: settings.dateFormat || "DD/MM/YYYY"
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ data: formData });
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
          <h2 className="text-2xl font-bold tracking-tight">إعدادات المنصة (Settings)</h2>
          <p className="text-muted-foreground text-sm">إدارة الإعدادات العامة والتفضيلات الأساسية.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>البيانات الأساسية</CardTitle>
            <CardDescription>هذه البيانات تظهر في التقارير والفواتير.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">اسم الشركة</label>
                <Input 
                  value={formData.companyName} 
                  onChange={e => setFormData({...formData, companyName: e.target.value})} 
                  placeholder="مثال: استوديو بيانات عقار"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">العملة الافتراضية</label>
                <Input 
                  value={formData.currency} 
                  onChange={e => setFormData({...formData, currency: e.target.value})} 
                  placeholder="EGP"
                  disabled
                />
                <p className="text-xs text-muted-foreground">يتم استخدام الجنيه المصري حالياً فقط.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>التفضيلات الإقليمية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">اللغة الأساسية</label>
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
                <label className="text-sm font-medium text-foreground">صيغة التاريخ</label>
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
            حفظ التغييرات
          </Button>
        </div>
      </form>
    </div>
  );
}
