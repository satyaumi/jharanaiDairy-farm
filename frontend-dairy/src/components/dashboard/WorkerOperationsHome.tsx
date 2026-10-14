import React, { useState, useMemo } from "react";
import {
  Milk,
  Wheat,
  Package,
  HeartPulse,
  Plus,
  Search,
  ChevronRight,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  Edit3,
} from "lucide-react";
import { CowIcon } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Animal, MilkRecord, StockItem } from "@/types/farm";
import { useAuth } from "@/context/AuthContext";

interface WorkerOperationsHomeProps {
  animals: Animal[];
  recentMilk: MilkRecord[];
  stockItems: StockItem[];
  onNavigateModule: (page: string) => void;
  onOpenQuickAdd: (actionKey?: string) => void;
  onSelectAnimal: (animal: Animal) => void;
  onEditAnimal?: (animal: Animal) => void;
}

export function WorkerOperationsHome({
  animals,
  recentMilk,
  stockItems,
  onNavigateModule,
  onOpenQuickAdd,
  onSelectAnimal,
  onEditAnimal,
}: WorkerOperationsHomeProps) {
  const { user } = useAuth();
  const [searchTag, setSearchTag] = useState("");

  // Direct Cow Lookup by unique Cow Number
  const matchedCow = useMemo(() => {
    if (!searchTag.trim()) return null;
    const q = searchTag.trim().toLowerCase();
    return (
      animals.find(
        (a) => (a.tag || "").toLowerCase() === q || a.id.toLowerCase() === q
      ) || null
    );
  }, [animals, searchTag]);

  const recentWorkerMilk = useMemo(() => recentMilk.slice(0, 4), [recentMilk]);

  return (
    <div className="space-y-4 pb-12 max-w-full overflow-hidden">
      {/* 1. Worker Operations Top App Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 p-4 text-white shadow-lg sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-black/10 blur-2xl" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 border-b border-white/15">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur-md shadow-sm">
              <CowIcon className="size-6 fill-white" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white sm:text-2xl">
                  Daily Farm Operations (ଦୈନନ୍ଦିନ କାର୍ଯ୍ୟ)
                </h1>
                <span className="rounded-full bg-emerald-500/30 border border-emerald-300/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-100 uppercase tracking-wider">
                  Worker Duty
                </span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-100/90 sm:text-xs">
                Welcome, {user?.fullName || "Worker"} · Ready for milking, feeding & livestock data entry
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => onOpenQuickAdd("record-milk")}
              className="h-9 gap-1.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 px-3.5 text-xs font-black shadow-md transition-transform active:scale-95"
            >
              <Plus className="size-3.5 stroke-[3]" />
              <span>Record Milk</span>
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenQuickAdd("add-animal")}
              className="h-9 gap-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-900 text-white border border-white/20 px-3 text-xs font-bold transition-transform active:scale-95"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              <span>Add Cow</span>
            </Button>
          </div>
        </div>

        {/* Quick Cow Number Search & Direct Action */}
        <div className="relative pt-3 sm:pt-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search unique Cow Number (e.g. C-2026, Ganga) for fast record..."
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                className="h-11 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 pl-10 pr-4 text-xs sm:text-sm font-semibold shadow-inner border-0 focus-visible:ring-2 focus-visible:ring-emerald-400"
              />
            </div>
            {matchedCow && (
              <Button
                size="sm"
                onClick={() => onSelectAnimal(matchedCow)}
                className="h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 shadow-md"
              >
                View {matchedCow.tag} Details
              </Button>
            )}
          </div>

          {/* Direct Cow Lookup Match Card */}
          {matchedCow && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white/95 p-3.5 text-slate-900 shadow-lg border border-white">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-800 font-black">
                  <CowIcon className="size-6 text-emerald-700" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-900">
                      Cow #{matchedCow.tag} {matchedCow.name ? `(${matchedCow.name})` : ""}
                    </p>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-extrabold">
                      {matchedCow.status || "Healthy"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Breed: {matchedCow.breed} · Group: {matchedCow.type} · Stall: {matchedCow.pen || "General"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onEditAnimal && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditAnimal(matchedCow)}
                    className="h-8 rounded-xl px-2.5 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <Edit3 className="size-3 mr-1" />
                    Edit Cow
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => onOpenQuickAdd("record-milk")}
                  className="h-8 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-3 shadow-xs"
                >
                  <Milk className="size-3 mr-1" />
                  Record Milk
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectAnimal(matchedCow)}
                  className="h-8 rounded-xl px-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
                >
                  Full Profile
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Worker Core Operational Modules (Fast 5 Workstations) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Assigned Operational Workstations
          </h2>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            Select module to log data
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Animals & Herd Management */}
          <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-500/40">
            <div>
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-700">
                  <CowIcon className="size-7 text-emerald-700" />
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
                  {animals.length} Cows Registered
                </span>
              </div>
              <h3 className="mt-3 text-base font-black text-foreground">
                ଗୋପାଳନ · Herd Records
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Add new cows, search by Cow Number, update weight, pen location, lactation cycle, and health status.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/50">
              <Button
                size="sm"
                onClick={() => onOpenQuickAdd("add-animal")}
                className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
              >
                <Plus className="size-3.5 mr-1" /> Add Cow
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateModule("animals")}
                className="h-9 rounded-xl px-3 text-xs font-bold border-border/80"
              >
                Open List <ChevronRight className="size-3.5 ml-0.5" />
              </Button>
            </div>
          </div>

          {/* Card 2: Milk Harvest */}
          <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:shadow-md hover:border-sky-500/40">
            <div>
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-sky-500/15 text-sky-700">
                  <Milk className="size-6 text-sky-700" />
                </span>
                <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-800 dark:text-sky-300">
                  Shift Harvest
                </span>
              </div>
              <h3 className="mt-3 text-base font-black text-foreground">
                ଦୁଗ୍ଧ ସଂଗ୍ରହ · Milk Harvest
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Log morning and evening milk yields for individual cows or use fast bulk group entry for stall rounds.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/50">
              <Button
                size="sm"
                onClick={() => onOpenQuickAdd("record-milk")}
                className="flex-1 h-9 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold"
              >
                <Plus className="size-3.5 mr-1" /> Record Milk
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateModule("milking")}
                className="h-9 rounded-xl px-3 text-xs font-bold border-border/80"
              >
                Milking Logs <ChevronRight className="size-3.5 ml-0.5" />
              </Button>
            </div>
          </div>

          {/* Card 3: Feed & Rations */}
          <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-500/40">
            <div>
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-amber-500/15 text-amber-700">
                  <Wheat className="size-6 text-amber-700" />
                </span>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 dark:text-amber-300">
                  Daily Rations
                </span>
              </div>
              <h3 className="mt-3 text-base font-black text-foreground">
                ଖାଦ୍ୟ ବଣ୍ଟନ · Feed & Rations
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Record green fodder, dry straw, and concentrate feeding rounds. Deducts automatically from warehouse stock.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/50">
              <Button
                size="sm"
                onClick={() => onOpenQuickAdd("feeding")}
                className="flex-1 h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold"
              >
                <Plus className="size-3.5 mr-1" /> Save Feed Round
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateModule("feeding")}
                className="h-9 rounded-xl px-3 text-xs font-bold border-border/80"
              >
                Feed Details <ChevronRight className="size-3.5 ml-0.5" />
              </Button>
            </div>
          </div>

          {/* Card 4: Stock & Feed Supply */}
          <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:shadow-md hover:border-cyan-500/40">
            <div>
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-cyan-500/15 text-cyan-700">
                  <Package className="size-6 text-cyan-700" />
                </span>
                <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-extrabold text-cyan-800 dark:text-cyan-300">
                  Warehouse
                </span>
              </div>
              <h3 className="mt-3 text-base font-black text-foreground">
                ଷ୍ଟକ୍ ଓ ଆମଦାନୀ · Stock & Supply
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Check available feed bags in warehouse, enter incoming harvest deliveries, and record stock replenishment.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/50">
              <Button
                size="sm"
                onClick={() => onOpenQuickAdd("stock")}
                className="flex-1 h-9 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-extrabold"
              >
                <Plus className="size-3.5 mr-1" /> Log Supply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateModule("stock")}
                className="h-9 rounded-xl px-3 text-xs font-bold border-border/80"
              >
                Stock View <ChevronRight className="size-3.5 ml-0.5" />
              </Button>
            </div>
          </div>

          {/* Card 5: Health & Veterinary Log */}
          <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-all hover:shadow-md hover:border-rose-500/40 sm:col-span-2 lg:col-span-2">
            <div>
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-rose-500/15 text-rose-700">
                  <HeartPulse className="size-6 text-rose-700" />
                </span>
                <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-800 dark:text-rose-300">
                  Clinical Care
                </span>
              </div>
              <h3 className="mt-3 text-base font-black text-foreground">
                ପଶୁ ଚିକିତ୍ସା · Animal Health & Care
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Enter sick-cow symptoms, treatment rounds, vaccinations given, pregnancy checkups, and calving dates for individual animals.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-border/50">
              <Button
                size="sm"
                onClick={() => onOpenQuickAdd("health")}
                className="h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold px-3.5"
              >
                <Plus className="size-3.5 mr-1" /> Log Sickness / Symptoms
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenQuickAdd("vaccination")}
                className="h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold px-3.5"
              >
                <Plus className="size-3.5 mr-1" /> Log Vaccination
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateModule("health")}
                className="h-9 rounded-xl px-3 text-xs font-bold border-border/80"
              >
                Health Records <ChevronRight className="size-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recent Operational Logs (Latest Milking Activity) */}
      <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div>
            <h3 className="text-sm font-black text-foreground">
              Recent Milking Logs (ଆଜିର ରେକର୍ଡ଼)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Latest milking submissions recorded on the farm
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onNavigateModule("milking")}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            All Milking Logs <ChevronRight className="size-3.5 ml-0.5" />
          </Button>
        </div>

        {recentWorkerMilk.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground font-semibold">
            No milking records logged yet today. Use the "Record Milk" button above to log a session.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recentWorkerMilk.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/50 p-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-xl bg-sky-500/15 text-sky-700 font-bold">
                    <Milk className="size-4" />
                  </span>
                  <div>
                    <p className="font-extrabold text-foreground">
                      Cow #{r.tag || r.animalName || "Cow"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {r.session} shift · {r.quality || "Normal quality"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                    {r.litres.toFixed(1)} L
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
