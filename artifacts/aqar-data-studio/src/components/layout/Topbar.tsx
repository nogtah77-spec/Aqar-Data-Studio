import { Link } from "wouter";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-10 shadow-sm">
      <div className="flex-1 max-w-xl">
        <Link href="/search" className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors w-full md:w-96 cursor-pointer border border-transparent hover:border-border">
          <Search size={16} />
          <span>البحث الشامل... (Global Search)</span>
          <kbd className="ms-auto inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Button asChild size="sm" className="gap-2 shadow-sm font-semibold">
          <Link href="/properties/new">
            <Plus size={16} />
            عقار جديد
          </Link>
        </Button>
        <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
          AD
        </div>
      </div>
    </header>
  );
}
