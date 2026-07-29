import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Building2, Upload, Download, MapPin,
  Home, List, Users, History, Settings, Menu, X, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { href: "/",              label: "الرئيسية",       labelEn: "Dashboard",   icon: LayoutDashboard },
  { href: "/properties",    label: "العقارات",        labelEn: "Properties",  icon: Building2 },
  { href: "/search",        label: "البحث",           labelEn: "Search",      icon: Search },
  { href: "/import",        label: "استيراد",         labelEn: "Import",      icon: Upload },
  { href: "/export",        label: "تصدير",           labelEn: "Export",      icon: Download },
  { href: "/regions",       label: "المناطق",         labelEn: "Regions",     icon: MapPin },
  { href: "/property-types",label: "أنواع العقارات",  labelEn: "Types",       icon: Home },
  { href: "/lookup",        label: "القوائم",         labelEn: "Lookup",      icon: List },
  { href: "/users",         label: "المستخدمين",      labelEn: "Users",       icon: Users },
  { href: "/audit-logs",    label: "سجل العمليات",   labelEn: "Audit Logs",  icon: History },
  { href: "/settings",      label: "الإعدادات",       labelEn: "Settings",    icon: Settings },
];

function NavLink({ item, active, onClick }: { item: typeof navItems[0]; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium outline-none focus-visible:ring-2 ring-ring",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <item.icon
        size={18}
        className={cn(active ? "text-primary" : "text-muted-foreground")}
      />
      <div className="flex flex-col">
        <span>{item.label}</span>
        <span className="text-[10px] text-muted-foreground font-normal leading-none mt-0.5">
          {item.labelEn}
        </span>
      </div>
    </Link>
  );
}

function BrandHeader() {
  return (
    <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
      <h1 className="text-xl font-bold text-sidebar-primary flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
          <Building2 size={16} />
        </div>
        <span className="tracking-tight">Aqar Data</span>
      </h1>
    </div>
  );
}

// ── Desktop sidebar ────────────────────────────────────────────────────────────

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-sidebar border-e border-sidebar-border hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden">
      <BrandHeader />
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));
          return <NavLink key={item.href} item={item} active={active} />;
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border shrink-0 text-xs text-muted-foreground flex items-center justify-between">
        <span>Aqar Data Studio</span>
        <span className="font-mono">v1.0</span>
      </div>
    </aside>
  );
}

// ── Mobile sidebar (sheet + hamburger) ────────────────────────────────────────

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-9 w-9"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
      >
        <Menu size={20} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72 p-0 bg-sidebar border-sidebar-border" dir="rtl">
          <SheetHeader className="p-0">
            <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
          </SheetHeader>
          <BrandHeader />
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
            {navItems.map((item) => {
              const active =
                location === item.href ||
                (item.href !== "/" && location.startsWith(item.href));
              return (
                <NavLink
                  key={item.href}
                  item={item}
                  active={active}
                  onClick={() => setOpen(false)}
                />
              );
            })}
          </nav>
          <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground flex items-center justify-between">
            <span>Aqar Data Studio</span>
            <span className="font-mono">v1.0</span>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
