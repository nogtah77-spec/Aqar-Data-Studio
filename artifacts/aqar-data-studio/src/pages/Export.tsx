import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter, FileSpreadsheet } from "lucide-react";

export default function Export() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">تصدير البيانات (Export)</h2>
        <p className="text-muted-foreground text-sm">استخراج بيانات العقارات لتنسيقات مختلفة لاستخدامها خارج المنصة.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="text-primary" />
              تصدير العقارات النشطة
            </CardTitle>
            <CardDescription>
              تصدير كافة العقارات النشطة والمتاحة للبيع أو الإيجار في ملف إكسيل.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gap-2">
              <Download size={16} />
              تحميل (Excel)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="text-secondary" />
              تصدير مخصص
            </CardTitle>
            <CardDescription>
              اختر الأعمدة المحددة وطبق الفلاتر قبل التصدير للحصول على تقرير مخصص.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2" disabled>
              إنشاء تقرير مخصص (قريباً)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
