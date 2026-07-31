import { useGlobalSearch } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
function useDebounceHook<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounceHook(query, 300);

  const { data, isLoading, isError } = useGlobalSearch(
    { q: debouncedQuery, limit: 20 },
    { query: { enabled: debouncedQuery.length > 1, queryKey: ['search', debouncedQuery] } }
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-4">
      <div className="relative">
        <SearchIcon className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
        <Input 
          className="h-16 text-xl ps-14 rounded-2xl shadow-sm border-card-border bg-card focus-visible:ring-primary/20"
          placeholder="ابحث عن عقار، منطقة، عميل، أو رقم مرجعي..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {debouncedQuery.length > 1 && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground px-2">
            {isLoading ? "جاري البحث..." : `تم العثور على ${data?.total || 0} نتيجة`}
          </div>

          {isError ? (
            <div className="py-16 text-center text-muted-foreground">
              تعذر تنفيذ البحث. حاول مرة أخرى.
            </div>
          ) : data?.results?.length ? (
            <div className="flex flex-col gap-3">
              {data.results.map((result) => (
              <Link key={`${result.type}-${result.id}`} href={
                result.type === 'property' ? `/properties/${result.id}` :
                result.type === 'region' ? `/regions` :
                result.type === 'property_type' ? `/property-types` :
                '/'
              }>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {result.label}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">
                          {result.type}
                        </span>
                        {result.subtitle && <span>{result.subtitle}</span>}
                      </div>
                    </div>
                    <ArrowLeft className="text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </CardContent>
                </Card>
              </Link>
              ))}
            </div>
          ) : !isLoading ? (
            <div className="py-16 text-center text-muted-foreground">
              لا توجد نتائج مطابقة للبحث.
            </div>
          ) : null}
        </div>
      )}
      
      {debouncedQuery.length <= 1 && (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <SearchIcon className="w-8 h-8 opacity-20" />
          </div>
          <p>اكتب حرفين على الأقل للبدء في البحث</p>
        </div>
      )}
    </div>
  );
}
