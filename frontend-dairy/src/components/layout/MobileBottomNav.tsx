import React from "react";
import { House, BarChart2, Plus, Bell, Settings } from "lucide-react";

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
      className="fixed inset-x-3 bottom-2 z-40 flex items-center justify-between rounded-3xl border border-slate-200/90 bg-white/95 px-2 py-1 shadow-2xl backdrop-blur-xl dark:border-border/80 dark:bg-card/95 lg:hidden pb-safe"
    >
      {/* 1. Home */}
      <button
        type="button"
        onClick={() => onNavigate("home")}
        className={`flex min-h-[50px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10px] font-bold transition-all active:scale-95 ${
          currentPage === "home"
            ? "text-emerald-700 dark:text-emerald-400 font-black"
            : "text-slate-500 hover:text-slate-900 dark:text-muted-foreground"
        }`}
        aria-label="Home Dashboard"
      >
        <House
          className="size-5"
          strokeWidth={currentPage === "home" ? 2.8 : 2}
        />
        <span>Home</span>
      </button>

      {/* 2. Analytics (Matching Reference Images 1 & 2) */}
      <button
        type="button"
        onClick={() => onNavigate("analytics")}
        className={`flex min-h-[50px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10px] font-bold transition-all active:scale-95 ${
          currentPage === "analytics"
            ? "text-emerald-700 dark:text-emerald-400 font-black"
            : "text-slate-500 hover:text-slate-900 dark:text-muted-foreground"
        }`}
        aria-label="Farm Analytics"
      >
        <BarChart2
          className="size-5"
          strokeWidth={currentPage === "analytics" ? 2.8 : 2}
        />
        <span>Analytics</span>
      </button>

      {/* 3. CENTRAL RECORD MILK / QUICK ADD ACTION */}
      <div className="relative -top-3 mx-1 flex shrink-0 items-center justify-center">
        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="group relative flex size-13 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/40 ring-4 ring-white dark:ring-card transition-transform active:scale-90"
          aria-label="Record Milk & Quick Add"
          title="Record Milk"
        >
          <Plus className="size-6 stroke-[3] transition-transform duration-200 group-hover:rotate-90" />
          <span className="sr-only">Record Milk</span>
        </button>
      </div>

      {/* 4. Alerts */}
      <button
        type="button"
        onClick={() => onNavigate("alerts")}
        className={`relative flex min-h-[50px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10px] font-bold transition-all active:scale-95 ${
          currentPage === "alerts"
            ? "text-emerald-700 dark:text-emerald-400 font-black"
            : "text-slate-500 hover:text-slate-900 dark:text-muted-foreground"
        }`}
        aria-label="Farm Alerts"
      >
        <div className="relative">
          <Bell
            className="size-5"
            strokeWidth={currentPage === "alerts" ? 2.8 : 2}
          />
          {alertCount > 0 && (
            <span className="absolute -right-2 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[8px] font-black text-white">
              {alertCount}
            </span>
          )}
        </div>
        <span>Alerts</span>
      </button>

      {/* 5. Settings */}
      <button
        type="button"
        onClick={() => onNavigate("settings")}
        className={`flex min-h-[50px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10px] font-bold transition-all active:scale-95 ${
          currentPage === "settings" || currentPage === "users"
            ? "text-emerald-700 dark:text-emerald-400 font-black"
            : "text-slate-500 hover:text-slate-900 dark:text-muted-foreground"
        }`}
        aria-label="Farm Settings"
      >
        <Settings
          className="size-5"
          strokeWidth={currentPage === "settings" || currentPage === "users" ? 2.8 : 2}
        />
        <span>Settings</span>
      </button>
    </nav>
  );
}
