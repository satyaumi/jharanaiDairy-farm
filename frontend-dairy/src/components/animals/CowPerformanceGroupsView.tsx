import React, { useState, useMemo } from "react";
import {
  Award,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Milk,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  HelpCircle,
  Calendar,
  Layers,
  ArrowUpDown,
  Settings2,
  CheckCircle2,
  X,
} from "lucide-react";
import { CowIcon } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Animal, MilkRecord } from "@/types/farm";
import {
  type PerformanceGrade,
  type PerformanceThresholds,
  getStoredThresholds,
  saveStoredThresholds,
  evaluateCowGrade,
  computeGroupSummary,
  DEFAULT_THRESHOLDS,
} from "@/lib/performance-grading";

interface CowPerformanceGroupsViewProps {
  animals: Animal[];
  recentMilk: MilkRecord[];
  onSelectAnimal: (animal: Animal) => void;
  onRecordMilk?: (animal: Animal) => void;
}

export function CowPerformanceGroupsView({
  animals,
  recentMilk,
  onSelectAnimal,
  onRecordMilk,
}: CowPerformanceGroupsViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"yield-desc" | "yield-asc" | "name">("yield-desc");
  const [period, setPeriod] = useState<"Today" | "7D" | "30D">("Today");

  // Configurable thresholds state
  const [thresholds, setThresholds] = useState<PerformanceThresholds>(getStoredThresholds);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempThresholds, setTempThresholds] = useState<PerformanceThresholds>(thresholds);

  // Summary counts
  const summary = useMemo(() => {
    return computeGroupSummary(animals, recentMilk, thresholds);
  }, [animals, recentMilk, thresholds]);

  // Evaluated cows list
  const evaluatedCows = useMemo(() => {
    return animals.map((cow) => {
      const evaluation = evaluateCowGrade(cow, recentMilk, thresholds);
      return {
        cow,
        evaluation,
      };
    });
  }, [animals, recentMilk, thresholds]);

  // Filtered & sorted list
  const filteredCows = useMemo(() => {
    return evaluatedCows
      .filter(({ cow, evaluation }) => {
        // Group filter
        if (selectedGroup !== "All") {
          if (evaluation.grade !== selectedGroup) return false;
        }

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = cow.name.toLowerCase().includes(q);
          const matchTag = cow.tag.toLowerCase().includes(q);
          const matchBreed = cow.breed.toLowerCase().includes(q);
          if (!matchName && !matchTag && !matchBreed) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "yield-desc") {
          return b.evaluation.dailyYield - a.evaluation.dailyYield;
        }
        if (sortBy === "yield-asc") {
          return a.evaluation.dailyYield - b.evaluation.dailyYield;
        }
        return a.cow.name.localeCompare(b.cow.name);
      });
  }, [evaluatedCows, selectedGroup, search, sortBy]);

  // Save customized thresholds
  const handleSaveThresholds = () => {
    saveStoredThresholds(tempThresholds);
    setThresholds(tempThresholds);
    setSettingsOpen(false);
  };

  const handleResetThresholds = () => {
    setTempThresholds(DEFAULT_THRESHOLDS);
    saveStoredThresholds(DEFAULT_THRESHOLDS);
    setThresholds(DEFAULT_THRESHOLDS);
    setSettingsOpen(false);
  };

  const GROUPS: { id: string; label: string; count: number; colorClass: string }[] = [
    { id: "All", label: "All Herd", count: summary.totalHerd, colorClass: "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200" },
    { id: "Excellent", label: "Excellent (≥" + thresholds.excellentMin + "L)", count: summary.excellentCount, colorClass: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300" },
    { id: "A", label: "Grade A (" + thresholds.aMin + "–" + thresholds.excellentMin + "L)", count: summary.aCount, colorClass: "text-teal-700 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-300" },
    { id: "B", label: "Grade B (" + thresholds.bMin + "–" + thresholds.aMin + "L)", count: summary.bCount, colorClass: "text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300" },
    { id: "C", label: "Grade C (" + thresholds.cMin + "–" + thresholds.bMin + "L)", count: summary.cCount, colorClass: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300" },
    { id: "D", label: "Grade D (" + thresholds.dMin + "–" + thresholds.cMin + "L)", count: summary.dCount, colorClass: "text-orange-700 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-300" },
    { id: "E", label: "Grade E (" + thresholds.eMin + "–" + thresholds.dMin + "L)", count: summary.eCount, colorClass: "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300" },
    { id: "F", label: "Grade F (<" + thresholds.eMin + "L)", count: summary.fCount, colorClass: "text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300" },
    { id: "Insufficient Data", label: "Insufficient Data", count: summary.insufficientCount, colorClass: "text-slate-500 bg-slate-50 dark:bg-slate-900 dark:text-slate-400" },
  ];

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
              <Award className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Milk Performance Groups
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Data-driven cow grouping (Excellent to F) evaluated strictly from verified milk yields
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-xl border border-border/80 bg-background/60 p-0.5">
            {(["Today", "7D", "30D"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  period === p
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Configurable Thresholds Trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTempThresholds(thresholds);
              setSettingsOpen(true);
            }}
            className="h-8 gap-1.5 rounded-xl border-border font-bold text-xs"
          >
            <Settings2 className="size-3.5" />
            <span>Grading Rules</span>
          </Button>
        </div>
      </div>

      {/* 2. SUMMARY CARDS BANNER */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <div className="farm-glass rounded-2xl p-2.5 border border-slate-200/80 dark:border-border text-center">
          <p className="text-[10px] uppercase font-bold text-muted-foreground">Eligible Herd</p>
          <p className="text-lg font-black text-foreground">{summary.eligibleCount}</p>
          <span className="text-[9px] text-muted-foreground">Active milking</span>
        </div>

        <div className="farm-glass rounded-2xl p-2.5 border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 text-center">
          <p className="text-[10px] uppercase font-black text-emerald-800 dark:text-emerald-300">Excellent</p>
          <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{summary.excellentCount}</p>
          <span className="text-[9px] text-emerald-600 font-bold">≥ {thresholds.excellentMin} L/d</span>
        </div>

        <div className="farm-glass rounded-2xl p-2.5 border border-teal-500/20 bg-teal-50/40 dark:bg-teal-950/20 text-center">
          <p className="text-[10px] uppercase font-black text-teal-800 dark:text-teal-300">Grade A</p>
          <p className="text-lg font-black text-teal-700 dark:text-teal-400">{summary.aCount}</p>
          <span className="text-[9px] text-teal-600 font-bold">≥ {thresholds.aMin} L/d</span>
        </div>

        <div className="farm-glass rounded-2xl p-2.5 border border-sky-500/20 bg-sky-50/40 dark:bg-sky-950/20 text-center">
          <p className="text-[10px] uppercase font-black text-sky-800 dark:text-sky-300">Grade B</p>
          <p className="text-lg font-black text-sky-700 dark:text-sky-400">{summary.bCount}</p>
          <span className="text-[9px] text-sky-600 font-bold">≥ {thresholds.bMin} L/d</span>
        </div>

        <div className="farm-glass rounded-2xl p-2.5 border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 text-center">
          <p className="text-[10px] uppercase font-black text-amber-800 dark:text-amber-300">Grade C</p>
          <p className="text-lg font-black text-amber-700 dark:text-amber-400">{summary.cCount}</p>
          <span className="text-[9px] text-amber-600 font-bold">≥ {thresholds.cMin} L/d</span>
        </div>

        <div className="farm-glass rounded-2xl p-2.5 border border-orange-500/20 bg-orange-50/40 dark:bg-orange-950/20 text-center">
          <p className="text-[10px] uppercase font-black text-orange-800 dark:text-orange-300">Grade D</p>
          <p className="text-lg font-black text-orange-700 dark:text-orange-400">{summary.dCount}</p>
          <span className="text-[9px] text-orange-600 font-bold">≥ {thresholds.dMin} L/d</span>
        </div>

        <div className="farm-glass rounded-2xl p-2.5 border border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 text-center">
          <p className="text-[10px] uppercase font-black text-rose-800 dark:text-rose-300">Grade E / F</p>
          <p className="text-lg font-black text-rose-700 dark:text-rose-400">{summary.eCount + summary.fCount}</p>
          <span className="text-[9px] text-rose-600 font-bold">Review Yield</span>
        </div>

        <div className="farm-glass rounded-2xl p-2.5 border border-slate-200 dark:border-border text-center">
          <p className="text-[10px] uppercase font-bold text-slate-500">Insufficient</p>
          <p className="text-lg font-black text-slate-600 dark:text-slate-400">{summary.insufficientCount}</p>
          <span className="text-[9px] text-slate-500">Dry / Calves</span>
        </div>
      </div>

      {/* 3. GROUP FILTER CHIPS (Horizontal Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {GROUPS.map((g) => {
          const active = selectedGroup === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGroup(g.id)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                active
                  ? "bg-emerald-600 text-white shadow-xs font-black ring-2 ring-emerald-500/20"
                  : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-card/80"
              }`}
            >
              <span>{g.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  active ? "bg-white/20 text-white" : "bg-muted text-foreground/80"
                }`}
              >
                {g.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. SEARCH & SORT BAR */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cow name, tag (e.g. C-1024), or breed..."
            className="pl-9 h-10 rounded-xl bg-card border-border/80 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowUpDown className="size-3.5" />
            <span>Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-10 rounded-xl border border-border/80 bg-card px-2.5 text-xs font-bold text-foreground focus:outline-hidden"
          >
            <option value="yield-desc">Yield: High to Low</option>
            <option value="yield-asc">Yield: Low to High</option>
            <option value="name">Cow Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* 5. COW CARDS LIST */}
      {filteredCows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center space-y-2">
          <AlertCircle className="size-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-black text-foreground">No Cows Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search
              ? `No cows match "${search}" in group "${selectedGroup}".`
              : `No cattle currently assigned to "${selectedGroup}".`}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearch("");
              setSelectedGroup("All");
            }}
            className="mt-2 rounded-xl text-xs font-bold"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCows.map(({ cow, evaluation }) => (
            <div
              key={cow.id}
              onClick={() => onSelectAnimal(cow)}
              className="group farm-glass rounded-2xl border border-slate-200/90 dark:border-border/80 p-3.5 transition-all hover:border-emerald-500/40 hover:shadow-md cursor-pointer space-y-3"
            >
              {/* Header: Name, Tag, Breed & Grade Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                    <CowIcon className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-foreground truncate">
                        {cow.name}
                      </h3>
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        ({cow.tag})
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {cow.breed} · Pen: {cow.pen} · Cycle {cow.lactationCycle || 1}
                    </p>
                  </div>
                </div>

                {/* Grade Badge */}
                <span
                  className={`shrink-0 rounded-xl px-2.5 py-1 text-xs border ${evaluation.badgeBg} ${evaluation.badgeText} ${evaluation.badgeBorder}`}
                >
                  {evaluation.grade === "Insufficient Data" ? "No Data" : `Grade ${evaluation.grade}`}
                </span>
              </div>

              {/* Yield & Performance Stats */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 dark:bg-muted/30 p-2 text-center">
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Today's Total</span>
                  <p className="text-xs sm:text-sm font-black text-foreground">
                    {evaluation.dailyYield > 0 ? `${evaluation.dailyYield} L` : "0.0 L"}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Valid Records</span>
                  <p className="text-xs sm:text-sm font-black text-foreground">
                    {evaluation.validRecordCount} sessions
                  </p>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Yield Trend</span>
                  <div className="flex items-center justify-center gap-1 text-xs font-bold">
                    {evaluation.trend === "rising" && (
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <TrendingUp className="size-3" /> Peak
                      </span>
                    )}
                    {evaluation.trend === "steady" && (
                      <span className="text-teal-600 flex items-center gap-0.5">
                        <Minus className="size-3" /> Steady
                      </span>
                    )}
                    {evaluation.trend === "declining" && (
                      <span className="text-rose-600 flex items-center gap-0.5">
                        <TrendingDown className="size-3" /> Review
                      </span>
                    )}
                    {evaluation.trend === "none" && (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Explanation & Last Milk Time */}
              <div className="flex items-start justify-between gap-2 pt-0.5 text-[11px]">
                <p className="text-muted-foreground leading-snug">
                  <span className="font-bold text-foreground">Basis: </span>
                  {evaluation.explanation}
                </p>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. CONFIGURABLE THRESHOLDS MODAL */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700">
                  <Settings2 className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-black text-foreground">Configure Grading Thresholds</h2>
                  <p className="text-[10px] text-muted-foreground">Adjust daily milk yield boundaries (Litres / Day)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Excellent Min (L/d)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={tempThresholds.excellentMin}
                    onChange={(e) =>
                      setTempThresholds({ ...tempThresholds, excellentMin: parseFloat(e.target.value) || 0 })
                    }
                    className="h-9 text-xs"
                  />
                  <span className="text-[9px] text-muted-foreground">Default: 20.0 L</span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Grade A Min (L/d)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={tempThresholds.aMin}
                    onChange={(e) =>
                      setTempThresholds({ ...tempThresholds, aMin: parseFloat(e.target.value) || 0 })
                    }
                    className="h-9 text-xs"
                  />
                  <span className="text-[9px] text-muted-foreground">Default: 16.0 L</span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Grade B Min (L/d)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={tempThresholds.bMin}
                    onChange={(e) =>
                      setTempThresholds({ ...tempThresholds, bMin: parseFloat(e.target.value) || 0 })
                    }
                    className="h-9 text-xs"
                  />
                  <span className="text-[9px] text-muted-foreground">Default: 13.0 L</span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Grade C Min (L/d)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={tempThresholds.cMin}
                    onChange={(e) =>
                      setTempThresholds({ ...tempThresholds, cMin: parseFloat(e.target.value) || 0 })
                    }
                    className="h-9 text-xs"
                  />
                  <span className="text-[9px] text-muted-foreground">Default: 10.0 L</span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Grade D Min (L/d)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={tempThresholds.dMin}
                    onChange={(e) =>
                      setTempThresholds({ ...tempThresholds, dMin: parseFloat(e.target.value) || 0 })
                    }
                    className="h-9 text-xs"
                  />
                  <span className="text-[9px] text-muted-foreground">Default: 7.0 L</span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Grade E Min (L/d)</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={tempThresholds.eMin}
                    onChange={(e) =>
                      setTempThresholds({ ...tempThresholds, eMin: parseFloat(e.target.value) || 0 })
                    }
                    className="h-9 text-xs"
                  />
                  <span className="text-[9px] text-muted-foreground">Default: 4.0 L (&lt; 4L is F)</span>
                </div>
              </div>

              <div className="rounded-xl bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                Note: Low yield indicates a need for management review or nutritional adjustment, not an automatic veterinary diagnosis.
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetThresholds}
                className="text-xs text-muted-foreground"
              >
                Reset Defaults
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveThresholds}
                  className="bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Apply & Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
