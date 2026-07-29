import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGlobalSearch } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { 
  Building, 
  LayoutDashboard, 
  Upload, 
  Download, 
  Settings2, 
  Database,
  Menu,
  Moon,
  Sun,
  Search,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data, isLoading } = useGlobalSearch(
    { q: query, limit: 5 }, 
    { query: { queryKey: ["global-search", query], enabled: query.length > 1 } }
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-sm hidden md:flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties, regions..."
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length > 1) setOpen(true);
              else setOpen(false);
            }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
            </div>
          ) : data?.results && data.results.length > 0 ? (
            <div className="py-2">
              <div className="px-3 text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Results</div>
              {data.results.map((res) => (
                <div 
                  key={`${res.type}-${res.id}`}
                  className="px-3 py-2 hover:bg-muted cursor-pointer flex flex-col"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    if (res.type === 'property') setLocation(`/properties/${res.id}/edit`);
                  }}
                >
                  <span className="font-medium text-sm" dir="auto">{res.label}</span>
                  {res.subtitle && <span className="text-xs text-muted-foreground truncate" dir="auto">{res.subtitle}</span>}
                </div>
              ))}
            </div>
          ) : query.length > 1 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/properties", label: "Properties", icon: Building },
    { href: "/import", label: "Import Data", icon: Upload },
    { href: "/export", label: "Export Studio", icon: Download },
    { href: "/lookups", label: "Reference Data", icon: Database },
    { href: "/settings", label: "Settings", icon: Settings2 },
  ];

  const NavLinks = () => (
    <div className="space-y-1">
      {navItems.map((item) => {
        const isActive = location === item.href || 
                         (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 border-r bg-card z-10">
        <div className="h-16 flex items-center px-6 border-b border-border font-semibold text-lg tracking-tight">
          <Building className="h-5 w-5 mr-2 text-primary" />
          Property Studio
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full justify-start" onClick={toggleTheme}>
            <Sun className="h-4 w-4 mr-2 hidden dark:block" />
            <Moon className="h-4 w-4 mr-2 block dark:hidden" />
            Toggle Theme
          </Button>
        </div>
      </aside>

      <header className="md:hidden h-14 border-b flex items-center justify-between px-4 bg-card sticky top-0 z-50">
        <div className="flex items-center font-semibold tracking-tight">
          <Building className="h-5 w-5 mr-2 text-primary" />
          Property Studio
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="h-16 flex items-center px-6 border-b font-semibold tracking-tight">
              <Building className="h-5 w-5 mr-2 text-primary" />
              Property Studio
            </div>
            <div className="p-4">
              <NavLinks />
            </div>
            <div className="p-4 absolute bottom-0 left-0 right-0 border-t bg-card">
              <Button variant="outline" className="w-full justify-start" onClick={toggleTheme}>
                <Sun className="h-4 w-4 mr-2 hidden dark:block" />
                <Moon className="h-4 w-4 mr-2 block dark:hidden" />
                Toggle Theme
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="flex-1 md:pl-64 flex flex-col min-h-[100dvh]">
        <div className="h-16 border-b hidden md:flex items-center px-8 bg-card/50 backdrop-blur sticky top-0 z-40">
          <GlobalSearch />
        </div>
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}