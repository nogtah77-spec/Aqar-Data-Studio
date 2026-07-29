import { Card, CardContent } from "@/components/ui/card";
import { List } from "lucide-react";

export default function Lookup() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <List size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">القوائم الديناميكية (Lookup Lists)</h2>
          <p className="text-muted-foreground text-sm">إدارة خيارات الحقول المتكررة (مثل أنواع التشطيب، التجهيزات، الإطلالة).</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center">
          <List size={48} className="mb-4 opacity-20" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">قيد التطوير</h3>
          <p>واجهة إدارة القوائم الديناميكية ستكون متاحة قريباً لتمكينك من إضافة وتعديل القيم للحقول المنسدلة في النظام بحرية تامة.</p>
        </CardContent>
      </Card>
    </div>
  );
}
