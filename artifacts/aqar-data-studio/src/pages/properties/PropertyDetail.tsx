import { useParams, Link } from "wouter";
import { useGetProperty, useGetPropertyHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatArea } from "@/lib/utils";
import { ArrowRight, Edit, MapPin, Home, Bed, Bath, Frame, Activity } from "lucide-react";

export default function PropertyDetail() {
  const params = useParams();
  const { data: property, isLoading } = useGetProperty(params.id!, { 
    query: { queryKey: ['property', params.id] } 
  });
  const { data: history } = useGetPropertyHistory(params.id!, {
    query: { queryKey: ['property-history', params.id] }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">جاري التحميل...</div>;
  }

  if (!property) {
    return <div className="p-8 text-center text-destructive">العقار غير موجود</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full mt-1 shrink-0">
            <Link href="/properties">
              <ArrowRight size={18} />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold tracking-tight">{property.title}</h2>
              <Badge variant={property.status === 'active' ? 'success' : 'default'} className="uppercase">
                {property.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2 font-mono">
              {property.code}
              {property.regionName && (
                <>
                  <span className="text-border">•</span>
                  <span className="flex items-center gap-1 font-sans"><MapPin size={14} /> {property.regionName}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild className="gap-2">
            <Link href={`/properties/${property.id}/edit`}>
              <Edit size={16} />
              تعديل
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معرض الصور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {property.images && property.images.length > 0 ? (
                  property.images.map((img, i) => (
                    <div key={i} className={`rounded-xl overflow-hidden bg-muted aspect-video ${i === 0 ? 'col-span-2 md:col-span-4 aspect-[21/9]' : ''}`}>
                      <img src={img} alt={`Property image ${i}`} className="w-full h-full object-cover" />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 md:col-span-4 aspect-[21/9] rounded-xl bg-muted/50 border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground">
                    <Frame size={48} className="mb-4 opacity-20" />
                    <p>لا توجد صور متاحة لهذا العقار.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">السعر</span>
                  <div className="font-bold text-lg text-primary">{formatPrice(property.price)}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">المساحة</span>
                  <div className="font-bold text-lg flex items-center gap-2">
                    <Frame size={18} className="text-muted-foreground" />
                    {formatArea(property.area)}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">غرف النوم</span>
                  <div className="font-bold text-lg flex items-center gap-2">
                    <Bed size={18} className="text-muted-foreground" />
                    {property.beds || '-'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">الحمامات</span>
                  <div className="font-bold text-lg flex items-center gap-2">
                    <Bath size={18} className="text-muted-foreground" />
                    {property.baths || '-'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الوصف</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {property.description || <span className="text-muted-foreground italic">لا يوجد وصف متاح.</span>}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>التصنيف</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">النوع</span>
                <span className="font-medium flex items-center gap-2">
                  <Home size={14} className="text-muted-foreground" />
                  {property.typeName || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">الفئة</span>
                <span className="font-medium">{property.category || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">التشطيب</span>
                <span className="font-medium">{property.finishing || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-2">
                <span className="text-muted-foreground">تم الإضافة</span>
                <span className="font-medium">
                  {new Date(property.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={18} />
                سجل التعديلات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history?.map(entry => (
                  <div key={entry.id} className="text-sm flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <div className="font-medium">{entry.action}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(entry.changedAt).toLocaleString('ar-EG')}
                      </div>
                    </div>
                  </div>
                ))}
                {(!history || history.length === 0) && (
                  <div className="text-sm text-muted-foreground">لا يوجد سجل تاريخي.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
