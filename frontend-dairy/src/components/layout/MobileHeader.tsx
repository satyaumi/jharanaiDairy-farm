import React from "react";
import { Bell, Grid, User as UserIcon } from "lucide-react";
import { CowBrandLogo } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
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
    <header className="farm-glass-strong sticky top-2 z-20 mb-3 flex min-h-[60px] items-center justify-between gap-2 rounded-2xl px-3 py-2 shadow-sm lg:hidden">
      {/* Brand & Cow Logo */}
      <div className="flex min-w-0 items-center gap-2">
        <CowBrandLogo size="xs" showText={false} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-bold text-foreground">
            Jharanai Farm
          </p>
          <span className="inline-block rounded-full bg-emerald-500/15 px-2 py-0.2 text-[9px] font-bold text-emerald-800 dark:text-emerald-300">
            {user?.role || "OWNER"}
          </span>
        </div>
      </div>

      {/* Right Quick Controls */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Modules Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenModules}
          className="h-10 gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-foreground/80 hover:bg-background/80"
          aria-label="All Farm Modules"
        >
          <Grid className="size-4 text-emerald-700 dark:text-emerald-400" />
          <span className="hidden sm:inline">Modules</span>
        </Button>

        {/* Alert Bell */}
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenAlerts}
          className="relative h-10 w-10 rounded-xl border-border/80 bg-background/60 shadow-none hover:bg-background"
          aria-label="Farm Alerts"
        >
          <Bell className="size-4.5 text-foreground" />
          {alertCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-extrabold text-white ring-2 ring-background">
              {alertCount}
            </span>
          )}
        </Button>

        {/* Profile Avatar / Trigger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenProfile}
          className="h-10 w-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
          aria-label="Farmer Profile"
        >
          {user?.name ? (
            <span className="text-xs font-extrabold">
              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </span>
          ) : (
            <UserIcon className="size-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
