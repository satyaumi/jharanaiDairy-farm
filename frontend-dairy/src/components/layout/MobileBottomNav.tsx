import React from "react";
import { House, Grid, Plus, Bell, User } from "lucide-react";

interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenQuickAdd: () => void;
  onOpenModules: () => void;
  onOpenProfile: () => void;
  alertCount?: number;
}

export function MobileBottomNav({
  currentPage,
  onNavigate,
  onOpenQuickAdd,
  onOpenModules,
  onOpenProfile,
  alertCount = 3,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Farm Mobile Navigation"
      className="farm-glass-strong fixed inset-x-2 bottom-2 z-40 flex items-center justify-between rounded-2xl border border-border/80 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden"
    >
      {/* 1. Home */}
      <button
        type="button"
        onClick={() => onNavigate("home")}
        className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold transition-all active:scale-95 ${
          currentPage === "home"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
            : "text-foreground/70 hover:bg-background/40 hover:text-foreground"
        }`}
        aria-label="Home Dashboard"
      >
        <House className="size-5" strokeWidth={currentPage === "home" ? 2.5 : 2} />
        <span>Home</span>
      </button>

      {/* 2. Modules */}
      <button
        type="button"
        onClick={onOpenModules}
        className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold transition-all active:scale-95 ${
          currentPage === "modules"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
            : "text-foreground/70 hover:bg-background/40 hover:text-foreground"
        }`}
        aria-label="All Farm Modules"
      >
        <Grid className="size-5" strokeWidth={currentPage === "modules" ? 2.5 : 2} />
        <span>Modules</span>
      </button>

      {/* 3. QUICK ADD (Visually Prominent Floating Button) */}
      <div className="relative -top-4 mx-1 flex shrink-0 items-center justify-center">
        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="group relative flex size-14 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/40 ring-4 ring-background transition-transform active:scale-90"
          aria-label="Quick Add Farm Entry"
        >
          <Plus className="size-7 stroke-[3] transition-transform duration-200 group-hover:rotate-90" />
          <span className="sr-only">Quick Add</span>
        </button>
      </div>

      {/* 4. Alerts */}
      <button
        type="button"
        onClick={() => onNavigate("alerts")}
        className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold transition-all active:scale-95 ${
          currentPage === "alerts"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
            : "text-foreground/70 hover:bg-background/40 hover:text-foreground"
        }`}
        aria-label="Farm Alerts"
      >
        <div className="relative">
          <Bell className="size-5" strokeWidth={currentPage === "alerts" ? 2.5 : 2} />
          {alertCount > 0 && (
            <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-extrabold text-white">
              {alertCount}
            </span>
          )}
        </div>
        <span>Alerts</span>
      </button>

      {/* 5. Profile */}
      <button
        type="button"
        onClick={onOpenProfile}
        className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold transition-all active:scale-95 ${
          currentPage === "profile"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
            : "text-foreground/70 hover:bg-background/40 hover:text-foreground"
        }`}
        aria-label="Farmer Profile"
      >
        <User className="size-5" strokeWidth={currentPage === "profile" ? 2.5 : 2} />
        <span>Profile</span>
      </button>
    </nav>
  );
}
