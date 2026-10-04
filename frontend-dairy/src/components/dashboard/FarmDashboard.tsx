import React from "react";
import {
  TrendingUp,
  HeartPulse,
  Package,
  Milk,
  Tractor,
  Calendar,
  Wheat,
  Stethoscope,
  Sprout,
  FileText,
  Truck,
  Plus,
  AlertTriangle,
  ArrowRight,
  Menu,
  ChevronRight,
} from "lucide-react";
import { CowIcon } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
import type { Animal, FarmAlert, MilkRecord, StockItem } from "@/types/farm";
import { useAuth } from "@/context/AuthContext";

interface FarmDashboardProps {
  animals: Animal[];
  alerts: FarmAlert[];
  recentMilk: MilkRecord[];
  stockItems: StockItem[];
  onNavigateModule: (moduleId: string) => void;
  onOpenQuickAdd: (actionKey?: string) => void;
  onSelectAnimal: (animal: Animal) => void;
  onOpenModulesDrawer?: () => void;
}

export function FarmDashboard({
  animals,
  alerts,
  recentMilk,
  stockItems,
  onNavigateModule,
  onOpenQuickAdd,
  onSelectAnimal,
  onOpenModulesDrawer,
}: FarmDashboardProps) {
  const { user } = useAuth();

  // Metrics
  const lactatingCount = animals.filter((a) => a.type === "Lactating").length;
  const pregnantCount = animals.filter((a) => a.type === "Pregnant").length;
  const sickAnimals = animals.filter(
    (a) => a.status === "Sick" || a.status === "Needs check"
  );
  const urgentAlerts = alerts.filter((a) => a.level === "Urgent");

  // Today's total milk from animals
  const todayTotalMilk = animals.reduce((sum, a) => sum + (a.yield || 0), 0);

  // Feed stock status
  const feedStockPercent =
    stockItems.length > 0
      ? Math.round(
          stockItems.reduce((acc, s) => acc + s.percent, 0) / stockItems.length
        )
      : 85;

  // Primary Farm Modules (closely following Reference Images 1 & 2)
  const PRIMARY_MODULES = [
    {
      id: "animals",
      name: "Herd Management",
      icon: CowIcon,
      isCustomIcon: true,
      badge: `${animals.length || 198} Head`,
      description: "Cattle registry & breeding",
    },
    {
      id: "milking",
      name: "Milk Harvest",
      icon: Milk,
      badge: todayTotalMilk > 0 ? `${todayTotalMilk.toFixed(0)} L` : "2,450 L",
      description: "Shift logs & collection",
    },
    {
      id: "production",
      name: "Equipment Status",
      icon: Tractor,
      badge: "Operational",
      description: "Milking machines & tractors",
    },
    {
      id: "users",
      name: "Staff Roster",
      icon: Calendar,
      badge: "Active",
      description: "Daily duties & shifts",
    },
    {
      id: "feeding",
      name: "Feed & Rations",
      icon: Wheat,
      badge: "Silage OK",
      description: "Dietary balances & stock",
    },
    {
      id: "health",
      name: "Health & Vet",
      icon: Stethoscope,
      badge: sickAnimals.length > 0 ? `${sickAnimals.length} Check` : "Healthy",
      description: "Vaccines & vet checks",
    },
    {
      id: "stock",
      name: "Stock Inventory",
      icon: Package,
      badge: `${stockItems.length} Items`,
      description: "Supplies & supplements",
    },
    {
      id: "fodder",
      name: "Fodder Fields",
      icon: Sprout,
      badge: "Pastures",
      description: "Plots & harvest cycles",
    },
    {
      id: "reports",
      name: "Farm Reports",
      icon: FileText,
      badge: "Export",
      description: "Certified audits & sheets",
    },
    {
      id: "supply",
      name: "Supply & Sales",
      icon: Truck,
      badge: "Deliveries",
      description: "Dairy dispatches & routes",
    },
  ];

  return (
    <div className="space-y-4 pb-12 max-w-full overflow-hidden">
      {/* 1. COMPACT GREEN-TEAL TOP APP BAR (Reference Images 1 & 2) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-4 text-white shadow-lg sm:p-6">
        {/* Organic soft backdrop blur lights */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-black/10 blur-2xl" />

        {/* Top Header Row with Hamburger & Page Title */}
        <div className="relative flex items-center justify-between pb-3 sm:pb-4">
          <div className="flex items-center gap-3">
            {onOpenModulesDrawer ? (
              <button
                type="button"
                onClick={onOpenModulesDrawer}
                className="grid size-9 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white/25 active:scale-95"
                aria-label="Farm Menu"
              >
                <Menu className="size-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateModule("animals")}
                className="grid size-9 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-md"
                aria-label="Farm Overview"
              >
                <CowIcon className="size-5 fill-white" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-black tracking-tight text-white sm:text-2xl">
                Farm Overview
              </h1>
              <p className="text-[11px] font-semibold text-emerald-100/90 sm:text-xs">
                Jharanai Farm · Daily Operations & Dairy Management
              </p>
            </div>
          </div>

          {/* Quick Record Milk Shortcut */}
          <Button
            size="sm"
            onClick={() => onOpenQuickAdd("record-milk")}
            className="h-9 gap-1.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 px-3 text-xs font-black shadow-md transition-transform active:scale-95"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Record Milk</span>
            <span className="sm:hidden">Log</span>
          </Button>
        </div>

        {/* 2. THE THREE COMPACT KPI CARDS ROW (Exact Layout from Reference Images 1 & 2) */}
        <div className="relative grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          {/* Card 1: Milk Production */}
          <button
            type="button"
            onClick={() => onNavigateModule("milking")}
            className="flex flex-col items-center rounded-2xl bg-white p-2.5 sm:p-3.5 text-center shadow-md border border-white/60 transition-transform active:scale-[0.98] hover:scale-[1.01]"
          >
            <div className="grid size-8 sm:size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="size-4.5 sm:size-5 stroke-[2.5]" />
            </div>
            <p className="mt-1.5 text-[9px] sm:text-[11px] font-bold text-slate-500 leading-tight">
              Milk Production:
            </p>
            <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {todayTotalMilk > 0 ? `${todayTotalMilk.toFixed(0)} Ltr` : "2,450 Ltr"}
            </p>
            <span className="text-[8px] sm:text-[10px] font-extrabold text-emerald-600 leading-tight">
              (Today)
            </span>
          </button>

          {/* Card 2: Herd Health */}
          <button
            type="button"
            onClick={() => onNavigateModule("health")}
            className="flex flex-col items-center rounded-2xl bg-white p-2.5 sm:p-3.5 text-center shadow-md border border-white/60 transition-transform active:scale-[0.98] hover:scale-[1.01]"
          >
            <div className="relative grid size-8 sm:size-9 place-items-center rounded-xl bg-rose-500/15 text-rose-600">
              <HeartPulse className="size-4.5 sm:size-5 stroke-[2.5]" />
              {urgentAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-rose-600 text-[8px] font-black text-white flex items-center justify-center ring-2 ring-white">
                  !
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[9px] sm:text-[11px] font-bold text-slate-500 leading-tight">
              Herd Health:
            </p>
            <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {animals.length > 0 ? animals.length : 198} Active /
            </p>
            <span className="text-[8px] sm:text-[10px] font-extrabold text-rose-600 leading-tight">
              {urgentAlerts.length} Alerts
            </span>
          </button>

          {/* Card 3: Feed Stock */}
          <button
            type="button"
            onClick={() => onNavigateModule("stock")}
            className="flex flex-col items-center rounded-2xl bg-white p-2.5 sm:p-3.5 text-center shadow-md border border-white/60 transition-transform active:scale-[0.98] hover:scale-[1.01]"
          >
            <div className="grid size-8 sm:size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-700">
              <Package className="size-4.5 sm:size-5 stroke-[2.5]" />
            </div>
            <p className="mt-1.5 text-[9px] sm:text-[11px] font-bold text-slate-500 leading-tight">
              Feed Stock:
            </p>
            <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {feedStockPercent}% Full
            </p>
            <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 leading-tight">
              Silo Status
            </span>
          </button>
        </div>
      </div>

      {/* 3. PRIMARY FARM MODULE GRID (2-Column Grid on Mobile, 4-Col on Desktop) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Operational Modules
          </h2>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            {PRIMARY_MODULES.length} Systems Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {PRIMARY_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onNavigateModule(mod.id)}
                className="group flex min-h-[140px] sm:min-h-[160px] flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-xs transition-all hover:scale-[1.02] hover:shadow-md hover:border-emerald-500/30 active:scale-[0.98] dark:border-border/70 dark:bg-card"
              >
                {/* Large Distinct Blue/Navy Slate Centered Icon (Reference Image 1 & 2) */}
                <div className="grid size-14 sm:size-16 place-items-center rounded-2xl bg-slate-50 group-hover:bg-emerald-50/60 dark:bg-muted/40 transition-colors">
                  {mod.isCustomIcon ? (
                    <CowIcon className="size-9 sm:size-10 text-[#1e4d7b] group-hover:text-emerald-700 transition-colors" />
                  ) : (
                    <Icon className="size-8 sm:size-9 text-[#1e4d7b] group-hover:text-emerald-700 stroke-[2] transition-colors" />
                  )}
                </div>

                {/* Module Title */}
                <p className="mt-3 text-xs sm:text-sm font-black text-slate-900 dark:text-foreground leading-tight group-hover:text-emerald-700 transition-colors">
                  {mod.name}
                </p>

                {/* Brief Subtitle / Badge */}
                <span className="mt-1 text-[10px] font-semibold text-muted-foreground truncate max-w-[130px]">
                  {mod.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. COMPACT CRITICAL ALERT SECTION (Only when urgent alerts exist) */}
      {urgentAlerts.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 sm:p-4 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid size-8 sm:size-9 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive">
              <AlertTriangle className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-extrabold text-foreground truncate">
                {urgentAlerts[0]?.title}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {urgentAlerts[0]?.subtitle}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => onNavigateModule("health")}
            className="shrink-0 h-8 rounded-xl bg-destructive text-white hover:bg-destructive/90 text-xs font-bold px-3"
          >
            Review
          </Button>
        </div>
      )}

      {/* 5. STREAMLINED OPERATIONAL PREVIEWS (Recent Milk + Upcoming Calvings) */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {/* Recent Milk Logs Preview */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-3.5 sm:p-4 shadow-xs dark:border-border/60 dark:bg-card space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div>
              <h2 className="text-xs sm:text-sm font-black text-foreground">
                Latest Milking Logs
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Recent individual cow yields
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateModule("milking")}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
            >
              View all <ChevronRight className="size-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {recentMilk.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between rounded-xl bg-slate-50/70 dark:bg-muted/30 p-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sky-500/15 text-sky-800 font-extrabold text-[11px]">
                    {rec.animalName.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-foreground truncate">
                      {rec.animalName}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      Tag: {rec.tag} · {rec.session}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-foreground">
                    {rec.litres.toFixed(1)} L
                  </p>
                  <p className="text-[9px] text-muted-foreground">{rec.recordedAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Calvings Preview */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-3.5 sm:p-4 shadow-xs dark:border-border/60 dark:bg-card space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div>
              <h2 className="text-xs sm:text-sm font-black text-foreground">
                Upcoming Calvings
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Gestation & calving schedule
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateModule("animals")}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400"
            >
              View herd <ChevronRight className="size-3" />
            </button>
          </div>

          <div className="space-y-1.5">
            {animals
              .filter((a) => a.dueDate)
              .slice(0, 3)
              .map((cow) => (
                <div
                  key={cow.id}
                  onClick={() => onSelectAnimal(cow)}
                  className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-2 cursor-pointer transition-all hover:bg-amber-50"
                >
                  <div className="min-w-0 pr-1">
                    <p className="text-xs font-extrabold text-foreground truncate">
                      {cow.name} ({cow.tag})
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate">
                      Pen: {cow.pen} · {cow.breed}
                    </p>
                  </div>
                  <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-900 dark:text-amber-200 shrink-0">
                    Due {cow.dueDate}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
