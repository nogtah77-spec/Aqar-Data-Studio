import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { 
  useGetProperty, 
  useCreateProperty, 
  useUpdateProperty 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function PropertyForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const isEdit = !!params.id && params.id !== "new";
  
  const { data: property, isLoading: isFetching } = useGetProperty(params.id || "", { 
    query: { enabled: isEdit, queryKey: ['property', params.id] } 
  });

  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    price: "",
    area: "",
    beds: "",
    baths: "",
    description: "",
    status: "active",
    category: "sale"
  });

  useEffect(() => {
    if (property) {
      setFormData({
        code: property.code || "",
        title: property.title || "",
        price: property.price?.toString() || "",
        area: property.area?.toString() || "",
        beds: property.beds?.toString() || "",
        baths: property.baths?.toString() || "",
        description: property.description || "",
        status: property.status || "active",
        category: property.category || "sale"
      });
    }
  }, [property]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      code: formData.code,
      title: formData.title,
      price: formData.price ? Number(formData.price) : undefined,
      area: formData.area ? Number(formData.area) : undefined,
      beds: formData.beds ? Number(formData.beds) : undefined,
      baths: formData.baths ? Number(formData.baths) : undefined,
      description: formData.description,
      status: formData.status,
      category: formData.category
    };

    if (isEdit) {
      updateMutation.mutate({ id: params.id!, data: payload }, {
        onSuccess: () => setLocation(`/properties/${params.id}`)
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: (res) => setLocation(`/properties/${res.id}`)
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isFetching) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Link href="/properties">
            <ArrowRight size={18} />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isEdit ? "تعديل العقار" : "إضافة عقار جديد"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isEdit ? `تحديث بيانات العقار ${property?.code}` : "إدخال بيانات العقار الأساسية."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>البيانات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">كود العقار *</label>
                <Input 
                  required 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})} 
                  placeholder="مثال: REF-1024"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">العنوان *</label>
                <Input 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="مثال: فيلا للبيع في التجمع"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">السعر (ج.م)</label>
                <Input 
                  type="number" 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">المساحة (م²)</label>
                <Input 
                  type="number" 
                  value={formData.area} 
                  onChange={e => setFormData({...formData, area: e.target.value})} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>التفاصيل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">الغرف</label>
                <Input 
                  type="number" 
                  value={formData.beds} 
                  onChange={e => setFormData({...formData, beds: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الحمامات</label>
                <Input 
                  type="number" 
                  value={formData.baths} 
                  onChange={e => setFormData({...formData, baths: e.target.value})} 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">الوصف</label>
                <textarea 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button asChild type="button" variant="outline">
            <Link href="/properties">
              إلغاء
            </Link>
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ العقار
          </Button>
        </div>
      </form>
    </div>
  );
}
