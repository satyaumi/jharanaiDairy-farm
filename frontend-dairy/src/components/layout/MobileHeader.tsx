import React from "react";
import { Bell, Menu, User as UserIcon } from "lucide-react";
import { CowBrandLogo } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
import { CloudHealthStatus } from "@/components/common/CloudHealthStatus";
import { useAuth } from "@/context/AuthContext";

interface MobileHeaderProps {
  onOpenModules: () => void;
  onOpenAlerts: () => void;
  onOpenProfile: () => void;
  alertCount?: number;
}

export function MobileHeader({
  onOpenModules,
  onOpenAlerts,
  onOpenProfile,
  alertCount = 3,
}: MobileHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-2 z-20 mb-3 flex min-h-[56px] items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur-md dark:border-border/80 dark:bg-card/95 lg:hidden">
      {/* Left: Hamburger Menu & Jharanai Farm Brand */}
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenModules}
          className="grid size-9 place-items-center rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 dark:bg-muted dark:text-foreground transition-all active:scale-95"
          aria-label="Open Farm Menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <CowBrandLogo size="xs" showText={false} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-black text-slate-900 dark:text-foreground">
              Jharanai Farm
            </p>
            <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.2 text-[9px] font-black text-emerald-800 dark:text-emerald-300">
              {user?.role || "OWNER"}
            </span>
          </div>
        </div>
      </div>

      {/* Right Quick Controls */}
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="hidden sm:block">
          <CloudHealthStatus />
        </div>

        {/* Alert Bell */}
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenAlerts}
          className="relative h-9 w-9 rounded-xl border-slate-200 bg-slate-50 text-slate-700 shadow-none hover:bg-slate-100 dark:border-border dark:bg-muted dark:text-foreground"
          aria-label="Farm Alerts"
        >
          <Bell className="size-4.5" />
          {alertCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white ring-2 ring-white dark:ring-card">
              {alertCount}
            </span>
          )}
        </Button>

        {/* Profile Avatar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenProfile}
          className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/25 dark:text-emerald-300"
          aria-label="Farmer Profile"
        >
          {user?.name ? (
            <span className="text-xs font-black">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          ) : (
            <UserIcon className="size-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
