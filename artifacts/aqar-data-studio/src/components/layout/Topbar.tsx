import { Link } from "wouter";
import { Search, Plus, Moon, Sun, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "./Sidebar";
import { useTheme } from "@/lib/theme";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Topbar() {
  const { theme, toggle } = useTheme();

  const openShortcuts = () => window.dispatchEvent(new CustomEvent("aqar:shortcuts-help"));

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between gap-3 px-4 md:px-6 shrink-0 sticky top-0 z-10 shadow-sm">
      {/* Mobile hamburger — hidden on md+ */}
      <MobileSidebar />

      {/* Search bar */}
      <div className="flex-1 min-w-0">
        <Link
          href="/search"
          className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors w-full max-w-md cursor-pointer border border-transparent hover:border-border"
        >
          <Search size={15} className="shrink-0" />
          <span className="truncate">البحث الشامل…</span>
          <kbd className="ms-auto hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm shrink-0">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Keyboard shortcuts hint */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hidden sm:flex"
              onClick={openShortcuts}
              aria-label="اختصارات لوحة المفاتيح"
            >
              <Keyboard size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">اختصارات لوحة المفاتيح (؟)</p>
          </TooltipContent>
        </Tooltip>

        {/* Dark mode toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggle}
              aria-label={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
            >
              {theme === "dark" ? (
                <Sun size={16} className="text-yellow-500" />
              ) : (
                <Moon size={16} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}</p>
          </TooltipContent>
        </Tooltip>

        {/* New property button */}
        <Button asChild size="sm" className="gap-1.5 shadow-sm font-semibold hidden xs:flex">
          <Link href="/properties/new">
            <Plus size={15} />
            <span className="hidden sm:inline">عقار جديد</span>
            <span className="sm:hidden">جديد</span>
          </Link>
        </Button>

        {/* Mobile-only: just the + icon */}
        <Button asChild size="icon" className="xs:hidden shadow-sm h-8 w-8">
          <Link href="/properties/new">
            <Plus size={16} />
          </Link>
        </Button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm shadow-sm cursor-pointer hover:opacity-90 transition-opacity select-none">
          AD
        </div>
      </div>
    </header>
  );
}
