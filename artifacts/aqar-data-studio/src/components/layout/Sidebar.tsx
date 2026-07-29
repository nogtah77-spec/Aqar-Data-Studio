import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Building2, 
  Upload, 
  Download, 
  MapPin, 
  Home, 
  List, 
  Users, 
  History, 
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "الرئيسية", labelEn: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "العقارات", labelEn: "Properties", icon: Building2 },
  { href: "/import", label: "استيراد", labelEn: "Import", icon: Upload },
  { href: "/export", label: "تصدير", labelEn: "Export", icon: Download },
  { href: "/regions", label: "المناطق", labelEn: "Regions", icon: MapPin },
  { href: "/property-types", label: "أنواع العقارات", labelEn: "Types", icon: Home },
  { href: "/lookup", label: "القوائم", labelEn: "Lookup", icon: List },
  { href: "/users", label: "المستخدمين", labelEn: "Users", icon: Users },
  { href: "/audit-logs", label: "سجل العمليات", labelEn: "Audit Logs", icon: History },
  { href: "/settings", label: "الإعدادات", labelEn: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-sidebar border-e border-sidebar-border hidden md:flex flex-col shrink-0 transition-all sticky top-0 h-screen overflow-hidden">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
        <h1 className="text-xl font-bold text-sidebar-primary flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Building2 size={18} />
          </div>
          <span className="tracking-tight uppercase">Aqar Data</span>
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium outline-none focus-visible:ring-2 ring-ring",
              isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}>
              <item.icon size={18} className={cn(isActive ? "text-primary" : "text-muted-foreground")} />
              <div className="flex flex-col">
                <span>{item.label}</span>
                <span className="text-[10px] text-muted-foreground font-normal leading-none mt-0.5">{item.labelEn}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border shrink-0 text-xs text-muted-foreground flex items-center justify-between">
        <span>Aqar Data Studio</span>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
}
