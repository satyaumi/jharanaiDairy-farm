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
  Sun,
  Moon,
  CheckCircle2,
  Calendar,
  Clock3,
  Stethoscope,
  ShieldCheck,
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

  // Quick Action cards on the dashboard
  const DASHBOARD_QUICK_ACTIONS = [
    { key: "record-milk", label: "Record Milk", note: "Morning / Evening", icon: Milk, color: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30" },
    { key: "add-animal", label: "Add Animal", note: "New cow or calf", icon: CowIcon, isCustom: true, color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30" },
    { key: "feeding", label: "Record Feeding", note: "Green / Dry feed", icon: Wheat, color: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30" },
    { key: "health", label: "Health Check", note: "Log check or fever", icon: Stethoscope, color: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30" },
    { key: "vaccination", label: "Vaccination", note: "Record dose", icon: ShieldCheck, color: "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30" },
    { key: "stock", label: "Stock Entry", note: "Feed in / out", icon: Package, color: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30" },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Welcoming Farmer Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Jharanai Farm · Today's Status
          </p>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground">
            Good morning, {user?.name?.split(" ")[0] || "Farmer"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Here is what needs your attention on the farm today
          </p>
        </div>

        <Button
          onClick={() => onOpenQuickAdd("record-milk")}
          className="h-12 gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="size-5 stroke-[2.5]" />
          Record Today's Milk
        </Button>
      </div>

      {/* 2. Top Priority Farm Numbers ("What is happening on my farm today?") */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {/* Today's Milk */}
        <button
          type="button"
          onClick={() => onNavigateModule("milking")}
          className="farm-glass group rounded-3xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              Today's Milk
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300">
              <Milk className="size-4.5" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
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
          className="farm-glass group rounded-3xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              Total Animals
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
              <CowIcon className="size-5" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            {animals.length} Cows
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground font-semibold">
            {lactatingCount} Milking · {pregnantCount} Pregnant
          </p>
        </button>

        {/* Animals Needing Attention (Crucial farm alert) */}
        <button
          type="button"
          onClick={() => onNavigateModule("health")}
          className="farm-glass group rounded-3xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              Need Attention
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-destructive/15 text-destructive">
              <HeartPulse className="size-4.5" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-destructive">
            {sickAnimals.length} Animals
          </p>
          <p className="mt-1 text-[11px] font-bold text-destructive/80">
            Recovery pen & check
          </p>
        </button>

        {/* Feed Used Today */}
        <button
          type="button"
          onClick={() => onNavigateModule("feeding")}
          className="farm-glass group rounded-3xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              Feed Used Today
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300">
              <Wheat className="size-4.5" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground">
            1,245 kg
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground font-semibold">
            Green + Concentrate
          </p>
        </button>
      </div>

      {/* 3. URGENT ATTENTION CALLOUT BANNER (if any) */}
      {urgentAlerts.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive">
              <AlertTriangle className="size-5" />
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
            className="shrink-0 h-9 rounded-xl bg-destructive text-white hover:bg-destructive/90 text-xs font-bold"
          >
            Check Cow
          </Button>
        </div>
      )}

      {/* 4. LARGE, OBVIOUS QUICK ACTIONS FOR WORKERS */}
      <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-foreground">
              Quick Farm Actions
            </h2>
            <p className="text-xs text-muted-foreground">
              Tap any button to record daily work in seconds
            </p>
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-muted-foreground">
            Touch-friendly 1-tap entry
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {DASHBOARD_QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => onOpenQuickAdd(action.key)}
                className="group flex min-h-[96px] flex-col items-start justify-between rounded-2xl border border-border/70 bg-card/60 p-3 text-left transition-all hover:bg-card hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <div
                  className={`grid size-10 place-items-center rounded-xl border ${action.color}`}
                >
                  {action.isCustom ? (
                    <CowIcon className="size-6" />
                  ) : (
                    <Icon className="size-5" />
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

      {/* 5. DUAL SECTIONS: TODAY'S MILKING + RECENT ATTENTION & CALVING */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
        {/* Left: Today's Milking Round Status */}
        <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                Today's Milking Records
              </h2>
              <p className="text-xs text-muted-foreground">
                Individual cow output from recent rounds
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateModule("milking")}
              className="text-xs font-bold text-primary"
            >
              All Records <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>

          <div className="space-y-2">
            {recentMilk.slice(0, 5).map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300 font-extrabold text-xs">
                    {rec.animalName.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-extrabold text-foreground truncate">
                      {rec.animalName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Tag: {rec.tag} · {rec.session} round
                    </p>
                  </div>
                </div>

                <div className="text-right">
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
            className="h-11 w-full gap-2 rounded-2xl text-xs font-bold"
          >
            <Plus className="size-4" /> Record Next Cow
          </Button>
        </div>

        {/* Right: Urgent Reminders & Calving Countdown */}
        <div className="space-y-4">
          {/* Calving / Pregnancy Reminders */}
          <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
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
                    className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 hover:bg-amber-500/10 cursor-pointer transition-all"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-foreground">
                        {cow.name} ({cow.tag})
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Pen: {cow.pen} · {cow.breed}
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900 dark:text-amber-200">
                      Due {cow.dueDate}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Quick Stock Summary */}
          <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
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
              className="w-full text-xs font-bold text-primary mt-1"
            >
              Open Stock Inventory <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
