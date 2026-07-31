import { useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetProperty, useGetPropertyHistory, useUpdateProperty } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatArea } from "@/lib/utils";
import { uploadPropertyImage } from "@/lib/supabase";
import { useCurrency } from "@/hooks/use-currency";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, Edit, MapPin, Home, Bed, Bath, Frame,
  Activity, ImagePlus, Trash2, Loader2, ExternalLink,
} from "lucide-react";

const STATUS_VARIANT: Record<string, any> = {
  active: "success", draft: "draft", sold: "destructive", rented: "info",
};
const STATUS_LABEL: Record<string, string> = {
  active: "نشط", draft: "مسودة", sold: "مباع", rented: "مؤجر",
};

export default function PropertyDetail() {
  const params = useParams();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const currency = useCurrency();
  const { isAgent } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const { data: property, isLoading } = useGetProperty(params.id!, {
    query: { queryKey: ["property", params.id] },
  });
  const { data: history } = useGetPropertyHistory(params.id!, {
    query: { queryKey: ["property-history", params.id] },
  });
  const { mutateAsync: updateProperty } = useUpdateProperty();

  // ── Image upload ────────────────────────────────────────────────────────────

  const handleUpload = async (files: FileList | null) => {
    if (!files || !property) return;
    setUploading(true);
    setUploadError(null);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadPropertyImage(property.id, file);
        uploaded.push(url);
      }
      if (uploaded.length > 0) {
        const existingImages: string[] = (property as any).images ?? [];
        await updateProperty({
          id: property.id,
          data: { images: [...existingImages, ...uploaded] } as any,
        });
        qc.invalidateQueries({ queryKey: ["property", params.id] });
        toast({ title: language === "ar" ? "تم رفع الصور" : "Photos uploaded" });
      }
    } catch (err: any) {
      setUploadError(err.message ?? (language === "ar" ? "فشل رفع الصورة" : "Could not upload the image"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDeleteImage = async (idx: number) => {
    if (!property) return;
    const imgs: string[] = [...((property as any).images ?? [])];
    imgs.splice(idx, 1);
    try {
      await updateProperty({ id: property.id, data: { images: imgs } as any });
      qc.invalidateQueries({ queryKey: ["property", params.id] });
      toast({ title: language === "ar" ? "تم حذف الصورة" : "Photo deleted" });
    } catch (err: any) {
      setUploadError(err.message ?? (language === "ar" ? "فشل حذف الصورة" : "Could not delete the image"));
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">{t("detail.loading")}</div>;
  }

  if (!property) {
    return <div className="p-8 text-center text-destructive">{t("detail.notFound")}</div>;
  }

  const images: string[] = (property as any).images ?? [];

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt={language === "ar" ? "صورة العقار" : "Property image"}
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center text-2xl hover:bg-black/70"
          >
            ×
          </button>
        </div>
      )}

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
                <Badge variant={STATUS_VARIANT[property.status ?? ""] ?? "default"} className="uppercase">
                  {STATUS_LABEL[property.status ?? ""] ?? property.status}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm flex items-center gap-2 font-mono">
                {property.code}
                {(property as any).regionName && (
                  <>
                    <span className="text-border">•</span>
                    <span className="flex items-center gap-1 font-sans">
                      <MapPin size={14} /> {(property as any).regionName}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
             {isAgent && <Button asChild className="gap-2">
              <Link href={`/properties/${property.id}/edit`}>
                <Edit size={16} />
                {t("detail.edit")}
              </Link>
             </Button>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Image gallery */}
            <Card>
              <CardHeader className="flex-row items-center justify-between pb-3 border-b">
                <CardTitle className="text-base">{t("detail.gallery")}</CardTitle>
                <div className="flex items-center gap-2">
                  {uploading && <Loader2 size={15} className="animate-spin text-muted-foreground" />}
                   {isAgent && (
                     <Button
                       size="sm"
                       variant="outline"
                       className="gap-1.5 text-xs h-7"
                       onClick={() => fileRef.current?.click()}
                       disabled={uploading}
                     >
                       <ImagePlus size={13} />
                        {uploading ? t("detail.uploading") : t("detail.upload")}
                     </Button>
                   )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {uploadError && (
                  <p className="text-xs text-destructive mb-3 bg-destructive/10 px-3 py-2 rounded-lg">
                    {uploadError}
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {images.length > 0 ? (
                    images.map((img, i) => (
                      <div
                        key={i}
                        className={`relative group rounded-xl overflow-hidden bg-muted aspect-video ${i === 0 ? "col-span-2 md:col-span-4 aspect-[21/9]" : ""}`}
                      >
                        <img
                          src={img}
                          alt={`صورة ${i + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setLightbox(img)}
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => setLightbox(img)}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
                           title={t("detail.view")}
                          >
                            <ExternalLink size={14} />
                          </button>
                           {isAgent && (
                             <button
                               onClick={() => handleDeleteImage(i)}
                               className="w-8 h-8 rounded-full bg-red-500/70 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                               title={t("detail.delete")}
                             >
                               <Trash2 size={14} />
                             </button>
                           )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 md:col-span-4 aspect-[21/9] rounded-xl bg-muted/50 border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:border-primary/40 hover:bg-muted/70 transition-colors"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Frame size={48} className="mb-4 opacity-20" />
                       <p className="text-sm">{t("detail.noImages")}</p>
                      <p className="text-xs mt-1 opacity-60">JPG، PNG، WebP</p>
                    </div>
                  )}
                </div>
                {images.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                     {images.length} {t("detail.imageCount")} · {t("detail.imageHint")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Key specs */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{t("detail.price")}</span>
                     <div className="font-bold text-lg text-primary">{formatPrice(property.price, currency, language)}</div>
                  </div>
                  <div className="space-y-1">
                     <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{t("detail.area")}</span>
                    <div className="font-bold text-lg flex items-center gap-2">
                      <Frame size={18} className="text-muted-foreground" />
                       {formatArea(property.area, language)}
                    </div>
                  </div>
                  <div className="space-y-1">
                     <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{t("detail.beds")}</span>
                    <div className="font-bold text-lg flex items-center gap-2">
                      <Bed size={18} className="text-muted-foreground" />
                      {property.beds || "-"}
                    </div>
                  </div>
                  <div className="space-y-1">
                     <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{t("detail.baths")}</span>
                    <div className="font-bold text-lg flex items-center gap-2">
                      <Bath size={18} className="text-muted-foreground" />
                      {property.baths || "-"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>{t("detail.description")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {property.description || (
                    <span className="text-muted-foreground italic">{t("detail.noDescription")}</span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("detail.classification")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: t("detail.type"), value: (property as any).typeName, icon: Home },
                  { label: t("detail.category"), value: property.category },
                  { label: t("detail.finishing"), value: property.finishing },
                  { label: t("detail.viewField"), value: (property as any).view },
                  { label: t("detail.floor"), value: (property as any).floorText || property.floor },
                  { label: t("detail.unitType"), value: (property as any).unitType },
                  { label: t("detail.subArea"), value: (property as any).subArea },
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ) : null
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t("detail.added")}</span>
                  <span className="font-medium">
                    {property.createdAt
                       ? new Date(property.createdAt).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")
                      : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* External links */}
            {((property as any).mapsUrl || (property as any).videoUrl || (property as any).externalUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t("detail.links")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(property as any).mapsUrl && (
                    <a href={(property as any).mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline">
                       <MapPin size={14} /> {t("detail.map")}
                    </a>
                  )}
                  {(property as any).videoUrl && (
                    <a href={(property as any).videoUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline">
                       <ExternalLink size={14} /> {t("detail.video")}
                    </a>
                  )}
                  {(property as any).externalUrl && (
                    <a href={(property as any).externalUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline">
                       <ExternalLink size={14} /> {t("detail.external")}
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity size={16} />
                   {t("detail.history")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history?.map((entry: any) => (
                    <div key={entry.id} className="text-sm flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <div className="font-medium">{entry.action}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                           {new Date(entry.changedAt).toLocaleString(language === "ar" ? "ar-EG" : "en-US")}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!history || history.length === 0) && (
                     <div className="text-sm text-muted-foreground">{t("detail.noHistory")}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
