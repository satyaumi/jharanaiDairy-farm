import React from "react";
import {
  Milk,
  Plus,
  HeartPulse,
  Wheat,
  Package,
  Sprout,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Calendar,
  Stethoscope,
  ShieldCheck,
  Factory,
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
}

export function FarmDashboard({
  animals,
  alerts,
  recentMilk,
  stockItems,
  onNavigateModule,
  onOpenQuickAdd,
  onSelectAnimal,
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

  // 1. Core Farm Modules (Cards First Hierarchy)
  const CORE_MODULES = [
    {
      id: "animals",
      name: "Herd & Cattle",
      desc: "Registry, pedigree & stages",
      icon: CowIcon,
      isCustom: true,
      color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
      badge: `${animals.length} Cows`,
    },
    {
      id: "milking",
      name: "Milk Production",
      desc: "Shift yields & fat/SNF logs",
      icon: Milk,
      color: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30",
      badge: todayTotalMilk > 0 ? `${todayTotalMilk.toFixed(0)}L Today` : "Daily Yield",
    },
    {
      id: "feeding",
      name: "Feeding & Rations",
      desc: "Silage, green feed & rations",
      icon: Wheat,
      color: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
      badge: "Nutrition",
    },
    {
      id: "health",
      name: "Health & Vet",
      desc: "Vaccines, treatments & checkups",
      icon: HeartPulse,
      color: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30",
      badge: sickAnimals.length > 0 ? `${sickAnimals.length} Checks` : "Healthy",
    },
    {
      id: "stock",
      name: "Stock Inventory",
      desc: "Feed, medicine & supply stocks",
      icon: Package,
      color: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30",
      badge: `${stockItems.length} Items`,
    },
    {
      id: "fodder",
      name: "Fodder Fields",
      desc: "Pasture crops & cutting cycles",
      icon: Sprout,
      color: "bg-lime-500/15 text-lime-800 dark:text-lime-300 border-lime-500/30",
      badge: "Pastures",
    },
    {
      id: "production",
      name: "Dairy Processing",
      desc: "Bulk milk cooling & bottling",
      icon: Factory,
      color: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30",
      badge: "Processing",
    },
    {
      id: "supply",
      name: "Customers & Supply",
      desc: "Delivery routes & billing accounts",
      icon: Users,
      color: "bg-violet-500/15 text-violet-800 dark:text-violet-300 border-violet-500/30",
      badge: "Supply",
    },
    {
      id: "reports",
      name: "Certified Reports",
      desc: "CSV, XLSX & PDF export records",
      icon: TrendingUp,
      color: "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30",
      badge: "Analytics",
    },
    {
      id: "team",
      name: "Team & Roles",
      desc: "Workers, shifts & permissions",
      icon: ShieldCheck,
      color: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30",
      badge: "Security",
    },
  ];

  // 2. Single Unambiguous Quick Actions Strip (1-tap fast modal triggers)
  const QUICK_ACTIONS = [
    { key: "record-milk", label: "Record Milk", note: "Morning / Evening", icon: Milk, color: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30" },
    { key: "add-animal", label: "Add Animal", note: "New cow / calf", icon: CowIcon, isCustom: true, color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30" },
    { key: "feeding", label: "Record Feeding", note: "Ration entry", icon: Wheat, color: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30" },
    { key: "health", label: "Health Check", note: "Log fever / check", icon: Stethoscope, color: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30" },
    { key: "vaccination", label: "Vaccination", note: "Record dose", icon: ShieldCheck, color: "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30" },
    { key: "stock", label: "Stock Entry", note: "Feed in / out", icon: Package, color: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30" },
  ];

  return (
    <div className="space-y-5 pb-8 max-w-full overflow-hidden">
      {/* 1. Header with Compact Mobile-Friendly Action Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Jharanai Farm · Live Operations
          </p>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground truncate">
            Good morning, {user?.name?.split(" ")[0] || "Farmer"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Complete daily farm management for dairy cows, yields, and operations
          </p>
        </div>

        {/* Proportional, Mobile-Friendly Action Button (Not 100% Full-Width) */}
        <Button
          onClick={() => onOpenQuickAdd("record-milk")}
          className="inline-flex items-center gap-2 h-11 px-4 rounded-2xl w-auto self-start sm:self-auto text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
        >
          <Plus className="size-4.5 stroke-[2.5]" />
          <span>Record Milk</span>
        </Button>
      </div>

      {/* 2. SECTION 1: PRIMARY APPLICATION MODULES (CARDS FIRST HIERARCHY) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-foreground">
              Farm Modules
            </h2>
            <p className="text-xs text-muted-foreground">
              Select any module to view records, logs, and management tools
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-semibold text-muted-foreground">
            10 Active Modules
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {CORE_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onNavigateModule(mod.id)}
                className="farm-glass group flex flex-col justify-between rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-left transition-all hover:scale-[1.02] hover:border-emerald-500/40 active:scale-[0.98] shadow-sm relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-1.5 w-full">
                  <span className={`grid size-9 sm:size-10 place-items-center rounded-xl border ${mod.color}`}>
                    {mod.isCustom ? (
                      <CowIcon className="size-5 sm:size-6" />
                    ) : (
                      <Icon className="size-4.5 sm:size-5" />
                    )}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-secondary/80 text-foreground/80 truncate max-w-[85px]">
                    {mod.badge}
                  </span>
                </div>

                <div className="mt-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-extrabold text-foreground truncate group-hover:text-emerald-600 transition-colors">
                      {mod.name}
                    </p>
                    <ChevronRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground line-clamp-1">
                    {mod.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SECTION 2: LIVE OPERATIONAL STATS & URGENT ALERTS */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-extrabold text-foreground">
          Today's Live Status
        </h2>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Today's Milk */}
          <button
            type="button"
            onClick={() => onNavigateModule("milking")}
            className="farm-glass rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Today's Milk</span>
              <span className="grid size-8 sm:size-9 place-items-center rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300">
                <Milk className="size-4 sm:size-4.5" />
              </span>
            </div>
            <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground">
              {todayTotalMilk > 0 ? `${todayTotalMilk.toFixed(0)} L` : "924 L"}
            </p>
            <p className="mt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="size-3.5" /> +4.8% on target
            </p>
          </button>

          {/* Total Herd */}
          <button
            type="button"
            onClick={() => onNavigateModule("animals")}
            className="farm-glass rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Total Cattle</span>
              <span className="grid size-8 sm:size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                <CowIcon className="size-4.5 sm:size-5" />
              </span>
            </div>
            <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground">
              {animals.length} Cows
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground font-semibold truncate">
              {lactatingCount} Milking · {pregnantCount} Pregnant
            </p>
          </button>

          {/* Need Attention */}
          <button
            type="button"
            onClick={() => onNavigateModule("health")}
            className="farm-glass rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Need Attention</span>
              <span className="grid size-8 sm:size-9 place-items-center rounded-xl bg-destructive/15 text-destructive">
                <HeartPulse className="size-4 sm:size-4.5" />
              </span>
            </div>
            <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold text-destructive">
              {sickAnimals.length} Animals
            </p>
            <p className="mt-1 text-[11px] font-bold text-destructive/80">
              Recovery pen & checks
            </p>
          </button>

          {/* Feed Used Today */}
          <button
            type="button"
            onClick={() => onNavigateModule("feeding")}
            className="farm-glass rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">Feed Used</span>
              <span className="grid size-8 sm:size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300">
                <Wheat className="size-4 sm:size-4.5" />
              </span>
            </div>
            <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground">
              1,245 kg
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground font-semibold">
              Green + Concentrate
            </p>
          </button>
        </div>

        {/* Priority Urgent Alert Banner (if any) */}
        {urgentAlerts.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive">
                <AlertTriangle className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-extrabold text-foreground truncate">
                  {urgentAlerts[0]?.title}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {urgentAlerts[0]?.subtitle}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => onNavigateModule("health")}
              className="shrink-0 h-8 sm:h-9 rounded-xl bg-destructive text-white hover:bg-destructive/90 text-xs font-bold px-3"
            >
              Check Cow
            </Button>
          </div>
        )}
      </div>

      {/* 4. SECTION 3: SINGLE DEDICATED QUICK OPERATIONS STRIP */}
      <div className="farm-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-foreground">
              Quick Farm Operations
            </h2>
            <p className="text-xs text-muted-foreground">
              1-tap shortcuts to log shifts, rations, and cattle health
            </p>
          </div>
          <span className="hidden sm:inline-block text-xs font-semibold text-muted-foreground">
            Touch-friendly 1-tap entry
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => onOpenQuickAdd(action.key)}
                className="group flex min-h-[88px] sm:min-h-[96px] flex-col items-start justify-between rounded-xl sm:rounded-2xl border border-border/70 bg-card/60 p-2.5 sm:p-3 text-left transition-all hover:bg-card hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <div className={`grid size-8 sm:size-9 place-items-center rounded-xl border ${action.color}`}>
                  {action.isCustom ? (
                    <CowIcon className="size-5" />
                  ) : (
                    <Icon className="size-4 sm:size-4.5" />
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-foreground leading-tight">
                    {action.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {action.note}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. SECTION 4: TODAY'S MILKING RECORDS + UPCOMING CALVINGS & STOCK */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
        {/* Left: Today's Milking Round Records */}
        <div className="farm-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-foreground">
                Today's Milking Records
              </h2>
              <p className="text-xs text-muted-foreground">
                Individual cow yield outputs from recent milking rounds
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateModule("milking")}
              className="text-xs font-bold text-primary hover:text-primary/90"
            >
              All Records <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>

          <div className="space-y-2">
            {recentMilk.slice(0, 5).map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-border/60 bg-card/40 p-2.5 sm:p-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300 font-extrabold text-xs">
                    {rec.animalName.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-foreground truncate">
                      {rec.animalName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Tag: {rec.tag} · {rec.session} round
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold text-foreground">
                    {rec.litres.toFixed(1)} L
                  </p>
                  <p className="text-[10px] text-muted-foreground">{rec.recordedAt}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => onOpenQuickAdd("record-milk")}
            className="h-10 sm:h-11 w-full gap-2 rounded-xl sm:rounded-2xl text-xs font-bold border-border"
          >
            <Plus className="size-4" /> Record Next Cow
          </Button>
        </div>

        {/* Right: Upcoming Calvings & Feed Stock Summary */}
        <div className="space-y-4">
          {/* Calving Reminders */}
          <div className="farm-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-foreground">
                Upcoming Calvings
              </h2>
              <Calendar className="size-4 text-amber-600" />
            </div>

            <div className="space-y-2">
              {animals
                .filter((a) => a.dueDate)
                .slice(0, 3)
                .map((cow) => (
                  <div
                    key={cow.id}
                    onClick={() => onSelectAnimal(cow)}
                    className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-amber-500/30 bg-amber-500/5 p-2.5 sm:p-3 hover:bg-amber-500/10 cursor-pointer transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-extrabold text-foreground truncate">
                        {cow.name} ({cow.tag})
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Pen: {cow.pen} · {cow.breed}
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 dark:text-amber-200 shrink-0">
                      Due {cow.dueDate}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Current Feed Stock */}
          <div className="farm-glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-foreground">
                Current Feed Stock
              </h2>
              <Package className="size-4 text-cyan-600" />
            </div>

            <div className="space-y-2">
              {stockItems.slice(0, 3).map((stk) => (
                <div key={stk.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-[170px]">
                      {stk.name}
                    </span>
                    <span className="font-extrabold text-foreground">
                      {stk.amount} {stk.unit}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        stk.trend === "low" ? "bg-amber-500" : "bg-emerald-600"
                      }`}
                      style={{ width: `${stk.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateModule("stock")}
              className="w-full text-xs font-bold text-primary hover:text-primary/90 mt-1"
            >
              Open Stock Inventory <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
