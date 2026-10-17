import React, { useState, useMemo, useEffect } from "react";
import {
  Sun,
  Moon,
  Calendar,
  Users,
  Search,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  RefreshCw,
  Info,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { Animal, MilkRecord } from "@/types/farm";
import { AnimalGroup, farmService } from "@/services/farm-service";
import { useAuth } from "@/context/AuthContext";
import { notify as toast } from "@/lib/notify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  evaluateCowGrade,
  DEFAULT_THRESHOLDS,
  PerformanceThresholds,
} from "@/lib/performance-grading";
import {
  useActionStatus,
  ActionSubmitButton,
  ActionInlineFeedback,
} from "@/components/common/ActionStatus";

export type GroupTab = "ALL" | "A" | "B" | "C" | "D" | "E" | "F";

export function isEligibleLactating(animal: Animal): boolean {
  if (!animal.active) return false;
  const type = animal.type;
  if (type === "Calf" || type === "Heifer") return false;

  const breedLower = (animal.breed || "").toLowerCase();
  const penLower = (animal.pen || "").toLowerCase();
  const nameLower = (animal.name || "").toLowerCase();
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

export function classifyAnimalGroup(
  animal: Animal,
  dbGroups: AnimalGroup[],
  records: MilkRecord[],
  thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS
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

export interface UnifiedGroupMilkingProps {
  animals: Animal[];
  records: MilkRecord[];
  onSaved?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const UnifiedGroupMilking: React.FC<UnifiedGroupMilkingProps> = ({
  animals,
  records,
  onSaved,
  onClose,
  isModal = false,
}) => {
  const { isOwner } = useAuth();
  const actionStatus = useActionStatus();

  // Session & Date Selection
  const [entryShift, setEntryShift] = useState<"Morning" | "Evening">("Morning");
  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Group selection & database groups
  const [selectedGroup, setSelectedGroup] = useState<GroupTab>("ALL");
  const [dbGroups, setDbGroups] = useState<AnimalGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customSelectionMode, setCustomSelectionMode] = useState(false);
  const [selectedCowIds, setSelectedCowIds] = useState<Set<string>>(new Set());

  // Input quantities mapped by animalId
  const [groupYields, setGroupYields] = useState<Record<string, string>>({});

  // Dual Workflow: Fast Group Milking vs Single Cow Recording
  const [milkingWorkflow, setMilkingWorkflow] = useState<"GROUP" | "SINGLE">("GROUP");
  const [singleAnimalId, setSingleAnimalId] = useState<string>("");
  const [singleSearch, setSingleSearch] = useState<string>("");
  const [singleLitres, setSingleLitres] = useState<string>("");
  const [singleQuality, setSingleQuality] = useState<string>("Normal");
  const [singleNotes, setSingleNotes] = useState<string>("");

  // Fetch registered DB groups safely
  useEffect(() => {
    let mounted = true;
    const fetchGroups = async () => {
      try {
        let res: any = null;
        if (typeof farmService.listGroups === "function") {
          res = await farmService.listGroups();
        } else if (typeof (farmService as any).getAnimalGroups === "function") {
          res = await (farmService as any).getAnimalGroups();
        }
        if (mounted && res) {
          const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
          if (list.length > 0) {
            setDbGroups(list);
          }
        }
      } catch {
        // Fallback silently if offline or network glitch
      }
    };
    fetchGroups();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter only eligible lactating cows
  const eligibleAnimals = useMemo(() => {
    return animals.filter(isEligibleLactating);
  }, [animals]);

  // Group membership map
  const animalGroupMap = useMemo(() => {
    const map = new Map<string, "A" | "B" | "C" | "D" | "E" | "F">();
    eligibleAnimals.forEach((a) => {
      map.set(a.id, classifyAnimalGroup(a, dbGroups, records));
    });
    return map;
  }, [eligibleAnimals, dbGroups, records]);

  // Animals belonging to current tab
  const tabAnimals = useMemo(() => {
    if (selectedGroup === "ALL") return eligibleAnimals;
    return eligibleAnimals.filter((a) => animalGroupMap.get(a.id) === selectedGroup);
  }, [eligibleAnimals, animalGroupMap, selectedGroup]);

  // Filtered by search and custom selection if active
  const displayedAnimals = useMemo(() => {
    let list = tabAnimals;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          (a.tag || "").toLowerCase().includes(q) ||
          (a.name || "").toLowerCase().includes(q) ||
          (a.breed || "").toLowerCase().includes(q)
      );
    }

    if (customSelectionMode && selectedCowIds.size > 0) {
      list = list.filter((a) => selectedCowIds.has(a.id));
    }

    return list;
  }, [tabAnimals, searchQuery, customSelectionMode, selectedCowIds]);

  // Existing records for selected date & shift to highlight prior logs
  const existingShiftRecords = useMemo(() => {
    const map = new Map<string, MilkRecord>();
    records.forEach((r) => {
      const rDate = r.date || (r as any).recordDate;
      if (
        rDate === entryDate &&
        r.shift &&
        r.shift.toLowerCase() === entryShift.toLowerCase()
      ) {
        map.set(r.animalId, r);
      }
    });
    return map;
  }, [records, entryDate, entryShift]);

  // Pre-fill existing records into input fields if empty
  useEffect(() => {
    setGroupYields((prev) => {
      const updated = { ...prev };
      existingShiftRecords.forEach((rec, animalId) => {
        if (!updated[animalId] && rec.litres > 0) {
          updated[animalId] = String(rec.litres);
        }
      });
      return updated;
    });
  }, [existingShiftRecords]);

  // Selected cow for single cow mode
  const selectedSingleCow = useMemo(() => {
    if (singleAnimalId) {
      return eligibleAnimals.find((a) => a.id === singleAnimalId) || eligibleAnimals[0];
    }
    return eligibleAnimals[0];
  }, [eligibleAnimals, singleAnimalId]);

  // Filtered cows for single cow search
  const filteredSingleAnimals = useMemo(() => {
    if (!singleSearch.trim()) return eligibleAnimals;
    const q = singleSearch.toLowerCase().trim();
    return eligibleAnimals.filter(
      (a) =>
        (a.tag || "").toLowerCase().includes(q) ||
        (a.name || "").toLowerCase().includes(q) ||
        (a.breed || "").toLowerCase().includes(q)
    );
  }, [eligibleAnimals, singleSearch]);

  // Pre-fill single cow input when cow or date/shift changes
  useEffect(() => {
    if (selectedSingleCow) {
      const existing = existingShiftRecords.get(selectedSingleCow.id);
      if (existing && existing.litres > 0) {
        setSingleLitres(String(existing.litres));
      } else {
        setSingleLitres("");
      }
    }
  }, [selectedSingleCow, existingShiftRecords]);

  // Total litres entered and animals with valid quantity entered
  const enteredStats = useMemo(() => {
    let total = 0;
    let count = 0;
    Object.entries(groupYields).forEach(([animalId, val]) => {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        total += num;
        count++;
      }
    });
    return {
      totalLitres: parseFloat(total.toFixed(2)),
      recordedCount: count,
    };
  }, [groupYields]);

  const handleYieldChange = (animalId: string, value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setGroupYields((prev) => ({
        ...prev,
        [animalId]: value,
      }));
    }
  };

  const handleAdjustYield = (animalId: string, delta: number) => {
    const current = parseFloat(groupYields[animalId] || "0") || 0;
    const next = Math.max(0, parseFloat((current + delta).toFixed(1)));
    setGroupYields((prev) => ({
      ...prev,
      [animalId]: next > 0 ? String(next) : "",
    }));
  };

  const toggleSelectCow = (animalId: string) => {
    setSelectedCowIds((prev) => {
      const next = new Set(prev);
      if (next.has(animalId)) {
        next.delete(animalId);
      } else {
        next.add(animalId);
      }
      return next;
    });
  };

  const selectAllInTab = () => {
    const next = new Set(selectedCowIds);
    tabAnimals.forEach((a) => next.add(a.id));
    setSelectedCowIds(next);
  };

  const clearSelectionInTab = () => {
    const next = new Set(selectedCowIds);
    tabAnimals.forEach((a) => next.delete(a.id));
    setSelectedCowIds(next);
  };

  const handleSaveSingleRecord = async () => {
    if (isOwner) {
      toast.error("Owner role is read-only. Milking entries cannot be recorded.");
      return;
    }

    const animal = selectedSingleCow;
    if (!animal) {
      toast.error("Please select a cow to record milk.");
      return;
    }

    const qty = parseFloat(singleLitres);
    if (isNaN(qty) || qty <= 0 || qty > 60) {
      const msg = `Invalid quantity for Cow #${animal.tag}: must be between 0.1 and 60 L.`;
      actionStatus.setError(msg);
      toast.error(msg);
      return;
    }

    await actionStatus.execute(
      async () => {
        return await farmService.recordMilk({
          animalId: animal.id,
          cowNumber: animal.tag,
          tag: animal.tag,
          animalName: animal.name,
          session: entryShift,
          shift: entryShift,
          date: entryDate,
          recordDate: entryDate,
          litres: qty,
          quality: singleQuality,
          notes: singleNotes.trim() || undefined,
        });
      },
      {
        submittingMessage: `Recording ${qty} L for Cow #${animal.tag}...`,
        successMessage: `Saved ${qty} L for Cow #${animal.tag} (${entryShift} session)!`,
        autoResetMs: 3500,
        onSuccess: () => {
          toast.success(`Recorded ${qty} L for Cow #${animal.tag} (${animal.name || animal.tag})!`, {
            description: `${entryShift} round on ${entryDate} persisted to database.`,
          });
          if (onSaved) onSaved();
          if (onClose) setTimeout(onClose, 800);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to save milk record. Please retry.");
        },
      }
    );
  };

  const handleSaveGroupRecords = async () => {
    if (isOwner) {
      toast.error("Owner role is read-only. Milking entries cannot be recorded.");
      return;
    }

    const entriesToSave = Object.entries(groupYields)
      .map(([animalId, val]) => {
        const litres = parseFloat(val);
        const animal = animals.find((a) => a.id === animalId);
        return {
          animalId,
          cowNumber: animal?.tag || animalId,
          tag: animal?.tag,
          litres,
        };
      })
      .filter((e) => !isNaN(e.litres) && e.litres > 0);

    if (entriesToSave.length === 0) {
      actionStatus.setError(
        "Please enter milk litres for at least one animal before saving."
      );
      toast.error("Please enter milk litres for at least one animal before saving.");
      return;
    }

    const invalidEntry = entriesToSave.find(
      (e) => e.litres <= 0 || e.litres > 60
    );
    if (invalidEntry) {
      const errorMsg = `Invalid quantity for Cow #${invalidEntry.cowNumber}: must be between 0.1 and 60 L.`;
      actionStatus.setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    await actionStatus.execute(
      async () => {
        return await farmService.recordBulkMilk({
          shift: entryShift,
          recordDate: entryDate,
          groupId: selectedGroup === "ALL" ? undefined : selectedGroup,
          records: entriesToSave,
          entries: entriesToSave,
        });
      },
      {
        submittingMessage: `Saving ${entriesToSave.length} milk records (${enteredStats.totalLitres} L)...`,
        successMessage: `Successfully recorded ${entriesToSave.length} cows (${enteredStats.totalLitres} L) for ${entryShift}!`,
        autoResetMs: 4000,
        onSuccess: () => {
          toast.success(
            `Successfully recorded ${entriesToSave.length} cows (${enteredStats.totalLitres} L) for ${entryShift}!`
          );
          if (onSaved) onSaved();
          if (onClose) {
            setTimeout(onClose, 800);
          }
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to save group milk records. Form data preserved.");
        },
      }
    );
  };

  return (
    <div className={`space-y-4 ${isModal ? "p-1" : ""}`}>
      {/* 1. Header controls: Milking Round & Date */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-background to-teal-500/10 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <Users className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-foreground sm:text-base">
                  ଗୋଠ ଅନୁସାରେ ଦୁଗ୍ଧ ଏଣ୍ଟ୍ରି · Fast Group Milking
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select herd group or multiple cows, toggle session, input litres by Cow Number, and save together.
                </p>
              </div>
            </div>
          </div>

          {/* Session & Date Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-border/80 bg-card p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setEntryShift("Morning")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  entryShift === "Morning"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="size-3.5" />
                <span>ସକାଳ (Morning)</span>
              </button>
              <button
                type="button"
                onClick={() => setEntryShift("Evening")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  entryShift === "Evening"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="size-3.5" />
                <span>ସନ୍ଧ୍ୟା (Evening)</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-2.5 py-1.5 shadow-xs">
              <Calendar className="size-3.5 text-muted-foreground" />
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Owner Read-Only Alert */}
      {isOwner && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          <Info className="size-4 shrink-0" />
          <span>
            <strong>Owner View:</strong> Read-only inspection mode. Recording and editing milk records is restricted to Farm Workers and Managers.
          </span>
        </div>
      )}

      {/* 2. Dual Milking Workflows: Fast Group Milking vs Single Cow Recording */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="inline-flex rounded-xl border border-border/80 bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setMilkingWorkflow("GROUP")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              milkingWorkflow === "GROUP"
                ? "bg-emerald-600 text-white shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="size-3.5" />
            <span>Fast Group Milking (ଗୋଠ ଅନୁସାରେ)</span>
          </button>
          <button
            type="button"
            onClick={() => setMilkingWorkflow("SINGLE")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              milkingWorkflow === "SINGLE"
                ? "bg-emerald-600 text-white shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>Single Cow Recording (ଏକକ ଗାଈ)</span>
          </button>
        </div>

        <span className="text-[11px] text-muted-foreground font-semibold">
          {milkingWorkflow === "GROUP"
            ? `${eligibleAnimals.length} eligible lactating cows in herd`
            : "Search by Cow Number, session & litres"}
        </span>
      </div>

      {/* SINGLE COW RECORDING WORKSPACE */}
      {milkingWorkflow === "SINGLE" && (
        <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-foreground">
                Single Cow Milk Entry · {entryShift} Session ({entryDate})
              </h4>
              <p className="text-xs text-muted-foreground">
                Select cow by unique Cow Number, enter harvest yield in litres, and save directly to database.
              </p>
            </div>
            {selectedSingleCow && (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
                Cow #{selectedSingleCow.tag} · Group {animalGroupMap.get(selectedSingleCow.id) || "F"}
              </Badge>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Left: Cow Search & Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-foreground">
                1. Select Cow Number (ଗାଈ ଚୟନ)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by Cow # (e.g. C-2026), Name or Breed..."
                  value={singleSearch}
                  onChange={(e) => setSingleSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs font-semibold"
                />
              </div>

              {/* Cow selection list */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border/60 p-1.5 space-y-1">
                {filteredSingleAnimals.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No matching lactating cow found.
                  </p>
                ) : (
                  filteredSingleAnimals.map((cow) => {
                    const isSelected = selectedSingleCow?.id === cow.id;
                    const prevRec = existingShiftRecords.get(cow.id);
                    return (
                      <button
                        key={cow.id}
                        type="button"
                        onClick={() => setSingleAnimalId(cow.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-all ${
                          isSelected
                            ? "bg-emerald-600 text-white font-extrabold shadow-sm"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${
                            isSelected ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                          }`}>
                            #{cow.tag}
                          </span>
                          <span className="truncate font-bold">
                            {cow.name && cow.name !== cow.tag ? `${cow.name} (${cow.breed || "Cow"})` : cow.breed || "Cow"}
                          </span>
                        </div>
                        <div className="text-right text-[10px] shrink-0">
                          {prevRec ? (
                            <span className={isSelected ? "text-emerald-100 font-bold" : "text-emerald-600 font-bold"}>
                              ✓ {prevRec.litres} L
                            </span>
                          ) : (
                            <span className={isSelected ? "text-white/80" : "text-muted-foreground"}>
                              Prev: {cow.yield || 0} L
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Litre Input & Submission */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-foreground">
                2. Enter Milk Quantity & Details
              </label>

              <div>
                <span className="text-[11px] font-bold text-muted-foreground">Milk Yield:</span>
                <div className="relative mt-1">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    disabled={isOwner || actionStatus.isSubmitting}
                    value={singleLitres}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || /^\d*\.?\d*$/.test(v)) {
                        setSingleLitres(v);
                      }
                    }}
                    className="h-12 rounded-xl bg-background pr-10 text-xl font-black text-foreground text-center"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">
                    L
                  </span>
                </div>
              </div>

              {/* Quick Stepper Buttons */}
              {!isOwner && (
                <div className="flex gap-1.5 pt-0.5">
                  {[0.5, 1.0, 2.0, 5.0].map((step) => (
                    <Button
                      key={step}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={actionStatus.isSubmitting}
                      onClick={() => {
                        const cur = parseFloat(singleLitres || "0") || 0;
                        const next = Math.max(0, +(cur + step).toFixed(1));
                        setSingleLitres(String(next));
                      }}
                      className="flex-1 h-9 rounded-xl border-border/80 text-xs font-bold active:scale-95"
                    >
                      +{step} L
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={actionStatus.isSubmitting}
                    onClick={() => setSingleLitres("")}
                    className="h-9 rounded-xl border-border/80 text-xs font-bold"
                  >
                    Clear
                  </Button>
                </div>
              )}

              {/* Quality & Notes */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                    Quality
                  </label>
                  <select
                    value={singleQuality}
                    disabled={isOwner || actionStatus.isSubmitting}
                    onChange={(e) => setSingleQuality(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-2.5 text-xs font-bold"
                  >
                    <option value="Normal">Normal (Standard)</option>
                    <option value="High Fat">High Fat (A Grade)</option>
                    <option value="Check needed">Check needed</option>
                    <option value="Colostrum">Colostrum (Fresh)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                    Notes (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Good morning yield"
                    disabled={isOwner || actionStatus.isSubmitting}
                    value={singleNotes}
                    onChange={(e) => setSingleNotes(e.target.value)}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Submit Single Cow Record */}
              {!isOwner ? (
                <div className="pt-2">
                  <ActionSubmitButton
                    status={actionStatus.status}
                    onClick={handleSaveSingleRecord}
                    disabled={!singleLitres || parseFloat(singleLitres) <= 0 || actionStatus.isSubmitting}
                    submittingText="Saving Single Cow Record..."
                    successText="Cow Record Saved!"
                    errorText="Save Failed · Tap to Retry"
                    className="w-full h-12 rounded-xl bg-emerald-700 text-white font-extrabold text-sm shadow-md hover:bg-emerald-800"
                    icon={<Check className="size-4" />}
                  >
                    Save Milk for Cow #{selectedSingleCow?.tag}
                  </ActionSubmitButton>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground text-center italic pt-2">
                  Owner read-only mode. Recording is restricted to Workers and Management.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAST GROUP MILKING WORKSPACE */}
      {milkingWorkflow === "GROUP" && (
        <>
          {/* 3. Group Selector Tabs (A–F) with Live Eligible Animal Counts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                ଗୋଠ (Herd Group):
              </span>
              {!isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomSelectionMode(!customSelectionMode)}
                    className={`flex items-center gap-1 text-[11px] font-bold rounded-lg px-2 py-1 border transition-all ${
                      customSelectionMode
                        ? "border-emerald-600 bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
                        : "border-border text-muted-foreground hover:bg-card"
                    }`}
                  >
                    <CheckSquare className="size-3.5" />
                    <span>Multi-Cow Select {customSelectionMode ? "ON" : "OFF"}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "ALL", label: "All Herd", count: eligibleAnimals.length },
              {
                id: "A",
                label: "Group A",
                count: eligibleAnimals.filter((a) => animalGroupMap.get(a.id) === "A").length,
              },
              {
                id: "B",
                label: "Group B",
                count: eligibleAnimals.filter((a) => animalGroupMap.get(a.id) === "B").length,
              },
              {
                id: "C",
                label: "Group C",
                count: eligibleAnimals.filter((a) => animalGroupMap.get(a.id) === "C").length,
              },
              {
                id: "D",
                label: "Group D",
                count: eligibleAnimals.filter((a) => animalGroupMap.get(a.id) === "D").length,
              },
              {
                id: "E",
                label: "Group E",
                count: eligibleAnimals.filter((a) => animalGroupMap.get(a.id) === "E").length,
              },
              {
                id: "F",
                label: "Group F",
                count: eligibleAnimals.filter((a) => animalGroupMap.get(a.id) === "F").length,
              },
            ] as const
          ).map((g) => {
            const isSelected = selectedGroup === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroup(g.id)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-500/30"
                    : "border border-border/80 bg-card text-muted-foreground hover:border-emerald-500/40 hover:text-foreground"
                }`}
              >
                <span>{g.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {g.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Group Info Callout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-card/60 p-2.5 border border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-foreground">
              {tabAnimals.length} eligible lactating {tabAnimals.length === 1 ? "animal" : "animals"} in{" "}
              {selectedGroup === "ALL" ? "all groups" : `Group ${selectedGroup}`}
            </span>
            <span className="text-[11px] text-muted-foreground/80">
              (Bulls, calves & non-lactating excluded)
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Cow #..."
              className="h-8 rounded-lg bg-background pl-8 text-xs"
            />
          </div>
        </div>

        {/* Multi-Cow custom selection bar */}
        {customSelectionMode && (
          <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2 text-xs">
            <span className="font-bold text-emerald-800 dark:text-emerald-200">
              {selectedCowIds.size} specific cows selected for partial group entry
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllInTab}
                className="h-7 text-xs font-semibold"
              >
                Select All in Tab
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelectionInTab}
                className="h-7 text-xs"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Cow Cards Grid */}
      <div className="max-h-[380px] overflow-y-auto rounded-2xl border border-border/60 bg-muted/20 p-2.5 space-y-2">
        {displayedAnimals.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No eligible lactating animals found in this group matching criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {displayedAnimals.map((animal) => {
              const currentVal = groupYields[animal.id] || "";
              const numVal = parseFloat(currentVal);
              const hasRecorded = !isNaN(numVal) && numVal > 0;
              const prevRec = existingShiftRecords.get(animal.id);
              const assignedTier = animalGroupMap.get(animal.id) || "F";
              const isChecked = selectedCowIds.has(animal.id);

              return (
                <div
                  key={animal.id}
                  className={`flex flex-col justify-between rounded-2xl border p-3 transition-all duration-200 ${
                    hasRecorded
                      ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                      : "border-border/80 bg-card hover:border-emerald-500/30"
                  }`}
                >
                  {/* Top: Cow details */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {customSelectionMode && (
                        <button
                          type="button"
                          onClick={() => toggleSelectCow(animal.id)}
                          className="text-emerald-700 dark:text-emerald-400 shrink-0"
                        >
                          {isChecked ? (
                            <CheckSquare className="size-4" />
                          ) : (
                            <Square className="size-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded-lg bg-emerald-600/10 px-2 py-0.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
                            #{animal.tag}
                          </span>
                          <span className="truncate text-xs font-bold text-foreground">
                            {animal.name && animal.name !== animal.tag ? animal.name : ""}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {animal.breed || "Cow"} · {animal.type} · Group {assignedTier}
                        </p>
                      </div>
                    </div>

                    {/* Performance Grade Badge */}
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-black text-emerald-700 dark:text-emerald-300 shrink-0"
                    >
                      Grp {assignedTier}
                    </Badge>
                  </div>

                  {/* Middle: Previous yield & session indicator */}
                  <div className="my-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      Prev: <strong className="text-foreground">{animal.yield || 0} L</strong>
                    </span>
                    {prevRec ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        <Check className="size-3" /> Logged ({prevRec.litres}L)
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Unrecorded</span>
                    )}
                  </div>

                  {/* Bottom: Litre Input & Quick Steppers */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={currentVal}
                        disabled={isOwner || actionStatus.isSubmitting}
                        onChange={(e) => handleYieldChange(animal.id, e.target.value)}
                        placeholder="0.0"
                        className="h-10 rounded-xl bg-background pr-7 text-center text-sm font-extrabold text-foreground"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        L
                      </span>
                    </div>

                    {!isOwner && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={actionStatus.isSubmitting}
                          onClick={() => handleAdjustYield(animal.id, 0.5)}
                          className="size-10 rounded-xl border-border/80 text-xs font-bold active:scale-95"
                          title="Add 0.5 L"
                        >
                          +0.5
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={actionStatus.isSubmitting}
                          onClick={() => handleAdjustYield(animal.id, 1.0)}
                          className="size-10 rounded-xl border-border/80 text-xs font-bold active:scale-95"
                          title="Add 1.0 L"
                        >
                          +1.0
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Action Status Feedback Banner */}
      <ActionInlineFeedback
        status={actionStatus.status}
        message={actionStatus.message}
        details={actionStatus.details}
      />

      {/* 5. Sticky Bottom Bar: Summary & Save Group Records Button */}
      <div className="rounded-2xl border border-emerald-500/20 bg-card p-4 shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Litres (ମୋଟ ଦୁଗ୍ଧ)
              </p>
              <p className="text-xl font-black text-emerald-800 dark:text-emerald-300">
                {enteredStats.totalLitres}{" "}
                <span className="text-sm font-semibold text-muted-foreground">Litres</span>
              </p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Cows with Milk (ରେକର୍ଡ ଗାଈ)
              </p>
              <p className="text-xl font-black text-foreground">
                {enteredStats.recordedCount}{" "}
                <span className="text-sm font-semibold text-muted-foreground">
                  / {tabAnimals.length}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={actionStatus.isSubmitting}
                className="h-12 rounded-xl px-4 text-xs font-bold"
              >
                Close
              </Button>
            )}

            {!isOwner && (
              <ActionSubmitButton
                status={actionStatus.status}
                onClick={handleSaveGroupRecords}
                disabled={enteredStats.recordedCount === 0 || actionStatus.isSubmitting}
                submittingText="Saving Group Records..."
                successText="Group Records Saved!"
                errorText="Save Failed · Tap to Retry"
                className="h-12 flex-1 rounded-xl bg-emerald-700 px-6 text-sm font-extrabold text-white shadow-md hover:bg-emerald-800 sm:flex-initial"
                icon={<Check className="size-4" />}
              >
                Save Milk Records (ଏକସଙ୍ଗେ ସେଭ୍ କରନ୍ତୁ)
              </ActionSubmitButton>
            )}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
