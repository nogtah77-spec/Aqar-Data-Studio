import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileDown, AlertTriangle } from "lucide-react";

export default function Import() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">استيراد البيانات (Import)</h2>
        <p className="text-muted-foreground text-sm">قم برفع ملفات Excel أو CSV لاستيراد العقارات دفعة واحدة.</p>
      </div>

      <Card className="border-dashed border-2 bg-muted/10">
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
            <Upload size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">اسحب وأفلت الملف هنا</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            المنصة تدعم استيراد البيانات بصيغة .xlsx أو .csv بحجم أقصى 10 ميجابايت للملف.
          </p>
          <div className="flex gap-4">
            <Button variant="outline">اختر ملف</Button>
            <Button variant="ghost" className="text-primary hover:text-primary/80 gap-2">
              <FileDown size={16} /> تحميل قالب فارغ
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-amber-500/10 text-amber-800 dark:text-amber-400 p-4 rounded-xl flex items-start gap-3 border border-amber-500/20">
        <AlertTriangle className="shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <p className="font-semibold mb-1">ملاحظات هامة قبل الاستيراد:</p>
          <ul className="list-disc list-inside space-y-1 ms-4">
            <li>تأكد من مطابقة أسماء الأعمدة في الملف المرفوع مع القالب.</li>
            <li>الأعمدة الإجبارية هي: كود العقار، العنوان، السعر.</li>
            <li>سيتم تخطي أي صف يحتوي على كود عقار مسجل مسبقاً إلا إذا تم تفعيل خيار "تحديث البيانات".</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
