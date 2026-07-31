import { Link } from "wouter";
import { Search, Plus, Moon, Sun, Keyboard, LogOut, User, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileSidebar } from "./Sidebar";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_LABELS: Record<string, { key: "role.admin" | "role.agent" | "role.viewer"; icon: typeof Shield }> = {
  admin: { key: "role.admin", icon: Shield },
  agent: { key: "role.agent", icon: User },
  viewer: { key: "role.viewer", icon: Eye },
};

function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const { t } = useLanguage();

  const displayName = profile?.name ?? user?.email?.split("@")[0] ?? t("role.viewer");
  const initials = displayName.slice(0, 2).toUpperCase();
  const role = profile?.role ?? "viewer";
  const roleInfo = ROLE_LABELS[role] ?? ROLE_LABELS.viewer;
  const RoleIcon = roleInfo.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-8 h-8 rounded-full bg-[#2F4156] text-white flex items-center justify-center font-bold text-xs shadow-sm hover:opacity-90 transition-opacity select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("topbar.userMenu")}
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-52">
        {/* User info */}
        <DropdownMenuLabel className="pb-1">
          <p className="text-sm font-semibold truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground font-normal truncate">{user?.email}</p>
        </DropdownMenuLabel>

        {/* Role badge */}
        <div className="px-2 pb-1">
          <span className="inline-flex items-center gap-1 text-xs bg-muted rounded px-1.5 py-0.5 text-muted-foreground">
            <RoleIcon size={10} />
            {t(roleInfo.key)}
          </span>
        </div>

        <DropdownMenuSeparator />

        {/* Sign out */}
        <DropdownMenuItem
          onClick={signOut}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 cursor-pointer"
        >
          <LogOut size={14} />
          {t("topbar.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  const { theme, toggle } = useTheme();
  const { isAgent } = useAuth();
  const { t, isArabic } = useLanguage();

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
          <span className="truncate">{t("topbar.globalSearch")}</span>
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
              aria-label={t("topbar.shortcuts")}
            >
              <Keyboard size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{t("topbar.shortcuts")} ({isArabic ? "؟" : "?"})</p>
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
              aria-label={theme === "dark" ? t("topbar.dayMode") : t("topbar.nightMode")}
            >
              {theme === "dark" ? (
                <Sun size={16} className="text-yellow-500" />
              ) : (
                <Moon size={16} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{theme === "dark" ? t("topbar.dayMode") : t("topbar.nightMode")}</p>
          </TooltipContent>
        </Tooltip>

        {/* New property button */}
        {isAgent && (
          <Button asChild size="sm" className="gap-1.5 shadow-sm font-semibold hidden xs:flex">
            <Link href="/properties/new">
              <Plus size={15} />
              <span className="hidden sm:inline">{t("topbar.newProperty")}</span>
              <span className="sm:hidden">{t("topbar.new")}</span>
            </Link>
          </Button>
        )}

        {/* Mobile-only: just the + icon */}
        {isAgent && (
          <Button asChild size="icon" className="xs:hidden shadow-sm h-8 w-8">
            <Link href="/properties/new">
              <Plus size={16} />
            </Link>
          </Button>
        )}

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}
