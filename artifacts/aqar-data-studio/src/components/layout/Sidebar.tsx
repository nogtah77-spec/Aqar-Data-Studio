import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Building2, Upload, Download, MapPin,
  Home, List, Users, History, Settings, Menu, Search,
  GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const navItems = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard, roles: ["admin", "agent", "viewer"] },
  { href: "/properties", labelKey: "nav.properties", icon: Building2, roles: ["admin", "agent", "viewer"] },
  { href: "/search", labelKey: "nav.search", icon: Search, roles: ["admin", "agent", "viewer"] },
  { href: "/compare", labelKey: "nav.compare", icon: GitCompare, roles: ["admin", "agent", "viewer"] },
  { href: "/import", labelKey: "nav.import", icon: Upload, roles: ["admin", "agent"] },
  { href: "/export", labelKey: "nav.export", icon: Download, roles: ["admin", "agent", "viewer"] },
  { href: "/regions", labelKey: "nav.regions", icon: MapPin, roles: ["admin", "agent"] },
  { href: "/property-types", labelKey: "nav.propertyTypes", icon: Home, roles: ["admin", "agent"] },
  { href: "/lookup", labelKey: "nav.lookup", icon: List, roles: ["admin", "agent"] },
  { href: "/users", labelKey: "nav.users", icon: Users, roles: ["admin"] },
  { href: "/audit-logs", labelKey: "nav.auditLogs", icon: History, roles: ["admin", "agent"] },
  { href: "/settings", labelKey: "nav.settings", icon: Settings, roles: ["admin"] },
];

function NavLink({ item, active, onClick }: { item: typeof navItems[0]; active: boolean; onClick?: () => void }) {
  const { t } = useLanguage();
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
      <span>{t(item.labelKey as Parameters<typeof t>[0])}</span>
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
  const { profile } = useAuth();
  const visibleItems = navItems.filter((item) => item.roles.includes(profile?.role ?? "viewer"));

  return (
    <aside className="w-64 bg-sidebar border-e border-sidebar-border hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-hidden">
      <BrandHeader />
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {visibleItems.map((item) => {
          const active =
            location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));
          return <NavLink key={item.href} item={item} active={active} />;
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border shrink-0 text-xs text-muted-foreground flex items-center justify-between">
        <span>Aqar Data Studio</span>
        <span className="font-mono">v1.1</span>
      </div>
    </aside>
  );
}

// ── Mobile sidebar (sheet + hamburger) ────────────────────────────────────────

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { profile } = useAuth();
  const { dir } = useLanguage();
  const visibleItems = navItems.filter((item) => item.roles.includes(profile?.role ?? "viewer"));

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-9 w-9"
        onClick={() => setOpen(true)}
        aria-label={dir === "rtl" ? "فتح القائمة" : "Open menu"}
      >
        <Menu size={20} />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-72 p-0 bg-sidebar border-sidebar-border" dir={dir}>
          <SheetHeader className="p-0">
            <SheetTitle className="sr-only">{dir === "rtl" ? "القائمة الرئيسية" : "Main menu"}</SheetTitle>
          </SheetHeader>
          <BrandHeader />
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
            {visibleItems.map((item) => {
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
            <span className="font-mono">v1.1</span>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
