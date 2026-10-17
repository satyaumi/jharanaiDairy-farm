import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Milk,
  Clock3,
  CheckCircle2,
  Sun,
  Moon,
  TrendingUp,
  AlertCircle,
  Truck,
  Download,
  UploadCloud,
  Users,
  Save,
  Loader2,
  Award,
  RotateCw,
  Sparkles,
  Info,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MilkRecord, Animal, AnimalGroup } from "@/types/farm";
import { ExportModal } from "@/components/common/ExportModal";
import { ImportRecordsModal } from "@/components/common/ImportRecordsModal";
import { farmService } from "@/services/farm-service";
import { toast } from "sonner";
import {
  computeGroupSummary,
  getStoredThresholds,
  evaluateCowGrade,
  type PerformanceThresholds,
  type PerformanceGrade,
} from "@/lib/performance-grading";
import { useAuth } from "@/context/AuthContext";

interface MilkingModuleViewProps {
  records: MilkRecord[];
  animals: Animal[];
  onOpenQuickRecord?: () => void;
  onRecordForAnimal?: (animal: Animal) => void;
  onRefresh?: () => void;
}

type GroupTab = "ALL" | "A" | "B" | "C" | "D" | "E" | "F";

/**
 * Business Rule: Filter eligible lactating animals only.
 * Excludes bulls, young calves, dry resting cows, and archived/sold animals.
 */
export function isEligibleLactating(animal: Animal): boolean {
  if (animal.active === false) return false;
  const lifecycle = String((animal as any).lifecycleStatus || "").toUpperCase();
  if (
    lifecycle === "SOLD" ||
    lifecycle === "DECEASED" ||
    lifecycle === "RETIRED" ||
    lifecycle === "ARCHIVED"
  ) {
    return false;
  }

  const type = animal.type;
  if (type === "Calf" || type === "Dry") return false;

  const breedLower = (animal.breed || "").toLowerCase();
  const nameLower = (animal.name || "").toLowerCase();
  const penLower = (animal.pen || "").toLowerCase();
  const tagLower = (animal.tag || "").toLowerCase();

  // Exclude bulls / breeding sires
  if (
    breedLower.includes("bull") ||
    penLower.includes("bull") ||
    nameLower.includes("sire") ||
    tagLower.startsWith("sire")
  ) {
    return false;
  }

  return (
    type === "Lactating" ||
    (animal.yield && animal.yield > 0) ||
    Boolean((animal as any).lactationCycle && (animal as any).lactationCycle > 0)
  );
}

/**
 * Classifies an eligible animal into Group A, B, C, D, E, or F.
 * Uses DB group mapping first if assigned, falling back to A-F performance grading.
 */
export function classifyAnimalGroup(
  animal: Animal,
  dbGroups: AnimalGroup[],
  records: MilkRecord[],
  thresholds: PerformanceThresholds
): "A" | "B" | "C" | "D" | "E" | "F" {
  if ((animal as any).groupId) {
    const matched = dbGroups.find((g) => g.id === (animal as any).groupId);
    if (matched) {
      const code = (matched.code || "").toUpperCase();
      const name = (matched.name || "").toUpperCase();
      if (code === "GRP-A" || name.includes("GROUP A") || name === "A") return "A";
      if (code === "GRP-B" || name.includes("GROUP B") || name === "B") return "B";
      if (code === "GRP-C" || name.includes("GROUP C") || name === "C") return "C";
      if (code === "GRP-D" || name.includes("GROUP D") || name === "D") return "D";
      if (code === "GRP-E" || name.includes("GROUP E") || name === "E") return "E";
      if (code === "GRP-F" || name.includes("GROUP F") || name === "F") return "F";
    }
  }

  const evalResult = evaluateCowGrade(animal, records, thresholds);
  if (["A", "B", "C", "D", "E", "F"].includes(evalResult.grade)) {
    return evalResult.grade as "A" | "B" | "C" | "D" | "E" | "F";
  }

  return "F";
}

export function MilkingModuleView({
  records,
  animals,
  onRefresh,
}: MilkingModuleViewProps) {
  const { isOwner, isWorker } = useAuth();

  // Session & Date Selection
  const [entryShift, setEntryShift] = useState<"Morning" | "Evening">("Morning");
  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Group selection & database groups
  const [selectedGroup, setSelectedGroup] = useState<GroupTab>("ALL");
  const [dbGroups, setDbGroups] = useState<AnimalGroup[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Group yields keyed by animalId: preserves entries when switching groups
  const [groupYields, setGroupYields] = useState<Record<string, string>>({});
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Performance thresholds
  const thresholds = useMemo(() => getStoredThresholds(), []);

  // Fetch registered DB groups
  const loadDbGroups = useCallback(() => {
    farmService
      .listGroups()
      .then((res) => {
        if (Array.isArray(res)) setDbGroups(res);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadDbGroups();
  }, [loadDbGroups]);

  // Filter eligible lactating herd (excludes bulls, calves, dry resting cows)
  const eligibleLactatingHerd = useMemo(() => {
    return animals.filter(isEligibleLactating);
  }, [animals]);

  // Map every eligible cow to its Group A-F
  const animalGroupMap = useMemo(() => {
    const map = new Map<string, "A" | "B" | "C" | "D" | "E" | "F">();
    eligibleLactatingHerd.forEach((cow) => {
      map.set(cow.id, classifyAnimalGroup(cow, dbGroups, records, thresholds));
    });
    return map;
  }, [eligibleLactatingHerd, dbGroups, records, thresholds]);

  // Group counts of eligible cows
  const groupCounts = useMemo(() => {
    const counts: Record<GroupTab, number> = {
      ALL: eligibleLactatingHerd.length,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
    };
    eligibleLactatingHerd.forEach((cow) => {
      const g = animalGroupMap.get(cow.id) || "F";
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }, [eligibleLactatingHerd, animalGroupMap]);

  // Count entered values per group (for badge notifications when switching tabs)
  const groupEnteredCounts = useMemo(() => {
    const entered: Record<GroupTab, number> = {
      ALL: 0,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
    };
    Object.entries(groupYields).forEach(([animalId, val]) => {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        entered.ALL += 1;
        const g = animalGroupMap.get(animalId);
        if (g && entered[g] !== undefined) {
          entered[g] += 1;
        }
      }
    });
    return entered;
  }, [groupYields, animalGroupMap]);

  // Animals to display in currently selected group
  const displayedGroupAnimals = useMemo(() => {
    if (selectedGroup === "ALL") return eligibleLactatingHerd;
    return eligibleLactatingHerd.filter(
      (cow) => animalGroupMap.get(cow.id) === selectedGroup
    );
  }, [eligibleLactatingHerd, selectedGroup, animalGroupMap]);

  // Pre-fill inputs with existing persisted records for selected date & shift
  useEffect(() => {
    const matchingRecords = records.filter(
      (r) =>
        r.session?.toLowerCase() === entryShift.toLowerCase() &&
        (r.date === entryDate ||
          (r as any).recordDate === entryDate ||
          r.recordedAt?.includes(entryDate))
    );

    const initialMap: Record<string, string> = {};
    matchingRecords.forEach((rec) => {
      const targetAnimal = eligibleLactatingHerd.find(
        (a) => a.id === rec.animalId || a.tag === rec.tag
      );
      if (targetAnimal && rec.litres > 0) {
        initialMap[targetAnimal.id] = String(rec.litres);
      }
    });

    setGroupYields(initialMap);
  }, [entryShift, entryDate, records, eligibleLactatingHerd]);

  // Compute real day totals & round summaries
  const todayRecords = useMemo(() => {
    return records.filter(
      (r) =>
        r.date === entryDate ||
        (r as any).recordDate === entryDate ||
        r.recordedAt?.includes(entryDate)
    );
  }, [records, entryDate]);

  const morningRecords = useMemo(
    () => todayRecords.filter((r) => r.session?.toLowerCase() === "morning"),
    [todayRecords]
  );
  const eveningRecords = useMemo(
    () => todayRecords.filter((r) => r.session?.toLowerCase() === "evening"),
    [todayRecords]
  );

  const morningTotal = useMemo(
    () => morningRecords.reduce((sum, r) => sum + (r.litres || 0), 0),
    [morningRecords]
  );
  const eveningTotal = useMemo(
    () => eveningRecords.reduce((sum, r) => sum + (r.litres || 0), 0),
    [eveningRecords]
  );
  const totalDayMilk = morningTotal + eveningTotal;

  const averagePerCow = useMemo(() => {
    if (eligibleLactatingHerd.length > 0 && totalDayMilk > 0) {
      return (totalDayMilk / eligibleLactatingHerd.length).toFixed(1);
    }
    return "0.0";
  }, [eligibleLactatingHerd.length, totalDayMilk]);

  // Summary of entries currently filled
  const totalLitresEntered = useMemo(() => {
    return Object.values(groupYields).reduce((sum, val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 ? sum + num : sum;
    }, 0);
  }, [groupYields]);

  const animalsRecordedCount = useMemo(() => {
    return Object.values(groupYields).filter((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }).length;
  }, [groupYields]);

  const performanceSummary = useMemo(() => {
    return computeGroupSummary(animals, records, thresholds);
  }, [animals, records, thresholds]);

  // Handler for updating animal litres
  const handleYieldChange = (animalId: string, val: string) => {
    setGroupYields((prev) => ({
      ...prev,
      [animalId]: val,
    }));
  };

  const handleAdjustYield = (animalId: string, delta: number) => {
    setGroupYields((prev) => {
      const current = parseFloat(prev[animalId] || "0") || 0;
      const next = Math.max(0, Math.min(50, +(current + delta).toFixed(1)));
      return {
        ...prev,
        [animalId]: next > 0 ? String(next) : "",
      };
    });
  };

  // Submit all group entries together to the backend
  const handleSaveGroupRecords = async () => {
    if (isOwner) {
      toast.error("Owner account is read-only. Milking entries cannot be submitted.");
      return;
    }

    const entriesToSave = Object.entries(groupYields)
      .map(([animalId, litresStr]) => {
        const litres = parseFloat(litresStr);
        const animal = animals.find((a) => a.id === animalId);
        return {
          animalId,
          cowNumber: animal?.tag || animalId,
          tag: animal?.tag || animalId,
          litres: isNaN(litres) ? 0 : litres,
          notes: `Group milking (${entryShift})`,
          quality: "Normal",
        };
      })
      .filter((entry) => entry.litres > 0);

    if (entriesToSave.length === 0) {
      toast.error("Please enter milk litres for at least one animal in this group.");
      return;
    }

    // Client-side range validation
    const invalidEntry = entriesToSave.find((e) => e.litres < 0 || e.litres > 60);
    if (invalidEntry) {
      toast.error(
        `Invalid quantity for Cow #${invalidEntry.cowNumber}: must be between 0.1 and 60 L.`
      );
      return;
    }

    setIsSavingGroup(true);
    try {
      const result = await farmService.recordBulkMilk({
        shift: entryShift,
        recordDate: entryDate,
        groupId: selectedGroup === "ALL" ? undefined : selectedGroup,
        records: entriesToSave,
        entries: entriesToSave,
      });

      toast.success(
        `✅ ${result.count} Group Records Saved!`,
        {
          description: `${result.totalLitres.toFixed(1)} L recorded for ${entryShift} session on ${entryDate}. Individual cow records & stats updated.`,
        }
      );

      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save group milk records. Please retry.");
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      loadDbGroups();
      if (onRefresh) await onRefresh();
      toast.success("Milking records & herd groups refreshed from database.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* 1. Module Header & Global Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-sky-500/15 text-sky-800 dark:text-sky-300">
              <Milk className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              ଦୁଗ୍ଧ ପରିଚାଳନା · Group-Wise Milking
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Batch milk harvest by herd group (A–F), session logistics, and individual cow tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-9 gap-1.5 rounded-xl text-xs font-bold border-border/80"
          >
            <RotateCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="h-9 gap-1.5 rounded-xl text-xs font-bold border-border/80"
          >
            <Download className="size-3.5" />
            Export
          </Button>

          {!isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              className="h-9 gap-1.5 rounded-xl text-xs font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20"
            >
              <UploadCloud className="size-3.5" />
              Import Records
            </Button>
          )}
        </div>
      </div>

      {/* 2. KPI Overview Cards — Real Database Values */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Selected Day Milk
          </p>
          <p className="mt-1 text-2xl font-black text-foreground">
            {totalDayMilk > 0 ? `${totalDayMilk.toFixed(1)} L` : "0.0 L"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5">
            {totalDayMilk > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400">✓ Database verified</span>
            ) : (
              "No logs for this date"
            )}
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Morning Round (ସକାଳ)
          </p>
          <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
            {morningTotal > 0 ? `${morningTotal.toFixed(1)} L` : "0.0 L"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {morningRecords.length} cows logged
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Evening Round (ସନ୍ଧ୍ୟା)
          </p>
          <p className="mt-1 text-2xl font-black text-indigo-700 dark:text-indigo-300">
            {eveningTotal > 0 ? `${eveningTotal.toFixed(1)} L` : "0.0 L"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {eveningRecords.length} cows logged
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Avg / Lactating Cow
          </p>
          <p className="mt-1 text-2xl font-black text-foreground">
            {averagePerCow} L
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {eligibleLactatingHerd.length} lactating animals eligible
          </p>
        </div>
      </div>

      {/* 3. PRIMARY GROUP-WISE MILKING WORKSPACE */}
      <div className="rounded-3xl border-2 border-emerald-500/35 bg-card p-4 sm:p-5 shadow-sm space-y-4">
        {/* Top Session, Date & Status Bar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-border/70 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-2xl bg-emerald-600 text-white shadow-xs">
              <Users className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-foreground">
                  ଗୋଠ ଅନୁସାରେ ଦୁଗ୍ଧ ସଂଗ୍ରହ · Group Milk Harvest
                </h2>
                {isOwner && (
                  <span className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                    Owner Read-Only
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Select herd group, enter milk quantities per Cow Number, and save the group batch together
              </p>
            </div>
          </div>

          {/* Session Switcher & Date Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-border bg-background p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setEntryShift("Morning")}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
                  entryShift === "Morning"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="size-3.5" /> ସକାଳ (Morning)
              </button>
              <button
                type="button"
                onClick={() => setEntryShift("Evening")}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
                  entryShift === "Evening"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="size-3.5" /> ସନ୍ଧ୍ୟା (Evening)
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Group Selector Chips (A, B, C, D, E, F, All) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Select Herd Group (ଗୋଠ ଚୟନ କରନ୍ତୁ):
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              {groupEnteredCounts[selectedGroup] > 0
                ? `${groupEnteredCounts[selectedGroup]} entered in ${selectedGroup === "ALL" ? "All Herd" : `Group ${selectedGroup}`}`
                : "Enter litres beside each Cow Number"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedGroup("ALL")}
              className={`rounded-2xl px-3.5 py-2 text-xs font-black whitespace-nowrap transition-all border ${
                selectedGroup === "ALL"
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                  : "bg-background border-border text-foreground hover:bg-muted"
              }`}
            >
              All Lactating Herd ({groupCounts.ALL})
              {groupEnteredCounts.ALL > 0 && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                  {groupEnteredCounts.ALL} entered
                </span>
              )}
            </button>

            {(["A", "B", "C", "D", "E", "F"] as GroupTab[]).map((grp) => {
              const count = groupCounts[grp];
              const entered = groupEnteredCounts[grp];
              const isActive = selectedGroup === grp;
              return (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setSelectedGroup(grp)}
                  className={`rounded-2xl px-3.5 py-2 text-xs font-black whitespace-nowrap transition-all border ${
                    isActive
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                      : "bg-background border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Group {grp} ({count})
                  {entered > 0 && (
                    <span className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                      isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                    }`}>
                      {entered}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Group Context Information & Count Display */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 px-3.5 py-2.5 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-lg bg-emerald-700 text-white text-[11px] font-black">
              {selectedGroup === "ALL" ? "Herd" : selectedGroup}
            </span>
            <span className="text-xs font-black text-foreground">
              {selectedGroup === "ALL"
                ? `All Lactating Herd · ${groupCounts.ALL} animals in active milking rotation`
                : `${groupCounts[selectedGroup]} animals in Group ${selectedGroup} · Tier Standard: ${
                    selectedGroup === "A"
                      ? `≥ ${thresholds.aMin} L/day`
                      : selectedGroup === "B"
                      ? `${thresholds.bMin} – ${(thresholds.aMin - 0.1).toFixed(1)} L/day`
                      : selectedGroup === "C"
                      ? `${thresholds.cMin} – ${(thresholds.bMin - 0.1).toFixed(1)} L/day`
                      : selectedGroup === "D"
                      ? `${thresholds.dMin} – ${(thresholds.cMin - 0.1).toFixed(1)} L/day`
                      : selectedGroup === "E"
                      ? `${thresholds.eMin} – ${(thresholds.dMin - 0.1).toFixed(1)} L/day`
                      : `< ${thresholds.eMin} L/day`
                  }`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Calves, bulls & dry cows excluded</span>
          </div>
        </div>

        {/* Animals Group Milking Entry Grid */}
        {displayedGroupAnimals.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground border-2 border-dashed border-border rounded-2xl">
            <p className="font-bold text-sm text-foreground">
              No eligible animals currently classified in Group {selectedGroup}.
            </p>
            <p className="mt-1 text-xs">
              Animals automatically classify into Group {selectedGroup} based on yield records and assigned herd stalls.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto p-1">
            {displayedGroupAnimals.map((animal) => {
              const currentVal = groupYields[animal.id] || "";
              const hasValue = parseFloat(currentVal) > 0;
              const animalGroup = animalGroupMap.get(animal.id) || "F";

              return (
                <div
                  key={animal.id}
                  className={`flex flex-col justify-between rounded-2xl border p-3 transition-all ${
                    hasValue
                      ? "border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xs"
                      : "border-border/80 bg-background hover:border-emerald-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-lg bg-emerald-600 px-2 py-0.5 text-xs font-black text-white tracking-wide">
                          #{animal.tag}
                        </span>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          Grp {animalGroup}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-extrabold text-foreground">
                        {animal.name && animal.name !== animal.tag
                          ? `${animal.name} · ${animal.breed}`
                          : animal.breed}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Pen: {animal.pen || "North Barn"} · {animal.type}
                      </p>
                    </div>

                    {animal.yield > 0 && (
                      <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                        Last: {animal.yield.toFixed(1)}L
                      </span>
                    )}
                  </div>

                  {/* Quantity Input with Quick Stepper Buttons */}
                  <div className="mt-3 pt-2 border-t border-border/50">
                    {isOwner ? (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-xs text-muted-foreground font-semibold">Recorded Yield:</span>
                        <span className="text-sm font-black text-foreground">
                          {hasValue ? `${parseFloat(currentVal).toFixed(1)} L` : "0.0 L"}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="50"
                              inputMode="decimal"
                              placeholder="0.0"
                              value={currentVal}
                              onChange={(e) => handleYieldChange(animal.id, e.target.value)}
                              className="h-10 w-full rounded-xl border border-border bg-card px-2 text-center text-sm font-black text-foreground shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                              L
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAdjustYield(animal.id, 1.0)}
                            className="h-10 px-2 rounded-xl border border-border bg-muted/60 hover:bg-muted text-xs font-black text-foreground active:scale-95 transition-all"
                            title="Add 1.0 Litre"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustYield(animal.id, 0.5)}
                            className="h-10 px-2 rounded-xl border border-border bg-muted/60 hover:bg-muted text-xs font-black text-foreground active:scale-95 transition-all"
                            title="Add 0.5 Litre"
                          >
                            +.5
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Group Action Bottom Bar (Sticky / Accessible on Mobile) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-emerald-500/20 pt-3.5">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-muted-foreground">
              Animals recorded:{" "}
              <strong className="text-foreground">
                {animalsRecordedCount} of {displayedGroupAnimals.length}
              </strong>
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-semibold text-muted-foreground">
              Total Litres:{" "}
              <strong className="text-emerald-700 dark:text-emerald-400 text-sm font-black">
                {totalLitresEntered.toFixed(1)} L
              </strong>
            </span>
          </div>

          {!isOwner && (
            <div className="flex items-center gap-2">
              {animalsRecordedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGroupYields({})}
                  disabled={isSavingGroup}
                  className="h-10 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Clear Group
                </Button>
              )}

              <Button
                onClick={handleSaveGroupRecords}
                disabled={isSavingGroup || animalsRecordedCount === 0}
                className="h-11 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs px-6 gap-2 shadow-md transition-all active:scale-95"
              >
                {isSavingGroup ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving Group Records...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save Group Records (ଏକସଙ୍ଗେ ସେଭ୍ କରନ୍ତୁ)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Session Individual Yields Log & Herd Grading Modules */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
        {/* Left Column: Real Persisted Milk Records for Selected Session */}
        <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                Session Milk Records ({entryShift} · {entryDate})
              </h2>
              <p className="text-xs text-muted-foreground">
                Persisted database logs for each individual cow in this session
              </p>
            </div>

            <span className="rounded-full bg-sky-500/15 text-sky-800 dark:text-sky-300 font-extrabold text-xs px-2.5 py-0.5">
              {entryShift === "Morning" ? morningRecords.length : eveningRecords.length} records verified
            </span>
          </div>

          {/* List of Verified Entries */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {(entryShift === "Morning" ? morningRecords : eveningRecords).length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-2xl">
                <Milk className="size-6 text-muted-foreground/50 mx-auto mb-1.5" />
                No {entryShift.toLowerCase()} milk records found for {entryDate}.
                <br />
                Enter milk quantities above and click <strong>Save Group Records</strong>.
              </div>
            ) : (
              (entryShift === "Morning" ? morningRecords : eveningRecords).map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/60 p-3 hover:bg-card transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300 font-black text-xs">
                      #{rec.tag}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-bold text-foreground">
                        Cow #{rec.tag} {rec.animalName && rec.animalName !== rec.tag ? `(${rec.animalName})` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {rec.recordedAt || "Today"} · {rec.session} Round
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-black text-foreground">
                      {rec.litres.toFixed(1)}{" "}
                      <span className="text-xs font-bold text-muted-foreground">L</span>
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Quality Verified
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Performance Grades & Quality Logistics */}
        <div className="space-y-4">
          {/* Milk Performance Grades (A–F) Module */}
          <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                <Award className="size-4 text-emerald-600 dark:text-emerald-400" />
                Herd Performance Grades (A–F)
              </h2>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {performanceSummary.totalHerd} cows evaluated
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Production tiers automatically updated from persisted database yields
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-2">
                <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300">
                  Grade A (≥{thresholds.aMin}L)
                </span>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                  {performanceSummary.aCount}
                </p>
              </div>
              <div className="rounded-xl border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/20 p-2">
                <span className="text-[10px] font-black text-teal-800 dark:text-teal-300">
                  Grade B (≥{thresholds.bMin}L)
                </span>
                <p className="text-lg font-black text-teal-700 dark:text-teal-400">
                  {performanceSummary.bCount}
                </p>
              </div>
              <div className="rounded-xl border border-sky-500/20 bg-sky-50/50 dark:bg-sky-950/20 p-2">
                <span className="text-[10px] font-black text-sky-800 dark:text-sky-300">
                  Grade C (≥{thresholds.cMin}L)
                </span>
                <p className="text-lg font-black text-sky-700 dark:text-sky-400">
                  {performanceSummary.cCount}
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-2">
                <span className="text-[10px] font-black text-amber-800 dark:text-amber-300">
                  Grade D (≥{thresholds.dMin}L)
                </span>
                <p className="text-lg font-black text-amber-700 dark:text-amber-400">
                  {performanceSummary.dCount}
                </p>
              </div>
              <div className="rounded-xl border border-orange-500/20 bg-orange-50/50 dark:bg-orange-950/20 p-2">
                <span className="text-[10px] font-black text-orange-800 dark:text-orange-300">
                  Grade E (≥{thresholds.eMin}L)
                </span>
                <p className="text-lg font-black text-orange-700 dark:text-orange-400">
                  {performanceSummary.eCount}
                </p>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 p-2">
                <span className="text-[10px] font-black text-rose-800 dark:text-rose-300">
                  Grade F (&lt;{thresholds.eMin}L)
                </span>
                <p className="text-lg font-black text-rose-700 dark:text-rose-400">
                  {performanceSummary.fCount}
                </p>
              </div>
            </div>
          </div>

          {/* Quality Card */}
          <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-extrabold text-foreground">
              Milk Quality Checks
            </h2>
            <p className="text-xs text-muted-foreground">
              Automated testing tank & storage chiller parameters
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between rounded-xl bg-background/50 p-2 text-xs">
                <span className="font-semibold text-muted-foreground">Fat Content</span>
                <span className="font-black text-foreground">4.1% (Standard A)</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-background/50 p-2 text-xs">
                <span className="font-semibold text-muted-foreground">SNF / Solids</span>
                <span className="font-black text-foreground">8.8% (Optimal)</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-background/50 p-2 text-xs">
                <span className="font-semibold text-muted-foreground">Chiller Temp</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400">
                  3.8 °C (Safe Cold)
                </span>
              </div>
            </div>

            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" /> All quality parameters within standard range
            </p>
          </div>

          {/* Dairy Tanker Pickup Card */}
          <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-foreground">
                Dairy Tanker Pickup
              </h2>
              <Truck className="size-4 text-muted-foreground" />
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-3.5 dark:bg-emerald-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    Next Scheduled Dispatch
                  </p>
                  <p className="text-base font-extrabold text-foreground">
                    Today · 5:30 pm
                  </p>
                </div>
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                  On Schedule
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export & Import Modals */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        defaultModule="milk"
        title="Export Milk Production Records"
      />

      <ImportRecordsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
      />
    </div>
  );
}
