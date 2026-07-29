import { useState } from "react";
import { useListProperties } from "@workspace/api-client-react";
import { Link } from "wouter";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatArea } from "@/lib/utils";
import { Search, Plus, Filter, MoreHorizontal, FileDown } from "lucide-react";

export default function PropertiesList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;

  const { data, isLoading } = useListProperties(
    { page, limit, search },
    { query: { queryKey: ['properties', { page, limit, search }] } }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">العقارات (Properties)</h2>
          <p className="text-muted-foreground text-sm">إدارة كافة العقارات المدرجة في المنصة.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <FileDown size={16} />
            تصدير
          </Button>
          <Button asChild className="gap-2">
            <Link href="/properties/new">
              <Plus size={16} />
              عقار جديد
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 bg-card p-2 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="بحث بالكود، العنوان، أو الوصف..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="ps-9 border-none shadow-none focus-visible:ring-0 bg-transparent"
          />
        </div>
        <div className="h-6 w-px bg-border hidden sm:block" />
        <Button variant="ghost" className="gap-2 shrink-0">
          <Filter size={16} />
          تصفية
        </Button>
      </div>

      <div className="rounded-xl border border-card-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">الكود</TableHead>
              <TableHead className="w-[250px]">العنوان</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>المساحة</TableHead>
              <TableHead>النوع / الفئة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 bg-muted rounded w-16 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-48 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-24 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-16 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-20 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-16 animate-pulse" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  لا توجد عقارات مطابقة للبحث.
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((property) => (
                <TableRow key={property.id} className="group">
                  <TableCell className="font-mono text-xs">{property.code}</TableCell>
                  <TableCell className="font-medium truncate max-w-[250px]" title={property.title}>
                    <Link href={`/properties/${property.id}`} className="hover:underline text-foreground">
                      {property.title}
                    </Link>
                  </TableCell>
                  <TableCell>{formatPrice(property.price)}</TableCell>
                  <TableCell>{formatArea(property.area)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <span>{property.typeName || '-'}</span>
                      <span className="text-muted-foreground">{property.category || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        property.status === 'active' ? 'success' : 
                        property.status === 'draft' ? 'draft' : 
                        property.status === 'sold' ? 'destructive' : 
                        property.status === 'rented' ? 'info' : 'default'
                      }
                      className="uppercase text-[10px]"
                    >
                      {property.status || 'draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
            <span>
              عرض {((page - 1) * limit) + 1} إلى {Math.min(page * limit, data.total)} من {data.total}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                السابق
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
