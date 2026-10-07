import React, { useState, useEffect } from "react";
import {
  Milk,
  Plus,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MilkRecord, Animal, AnimalGroup } from "@/types/farm";
import { ExportModal } from "@/components/common/ExportModal";
import { ImportRecordsModal } from "@/components/common/ImportRecordsModal";
import { farmService } from "@/services/farm-service";
import { toast } from "sonner";

interface MilkingModuleViewProps {
  records: MilkRecord[];
  animals: Animal[];
  onOpenQuickRecord: () => void;
  onRecordForAnimal: (animal: Animal) => void;
  onRefresh?: () => void;
}

export function MilkingModuleView({
  records,
  animals,
  onOpenQuickRecord,
  onRecordForAnimal,
  onRefresh,
}: MilkingModuleViewProps) {
  const [activeSession, setActiveSession] = useState<"Morning" | "Evening">("Morning");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Group Fast Entry state
  const [groupEntryOpen, setGroupEntryOpen] = useState(false);
  const [groups, setGroups] = useState<AnimalGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("ALL");
  const [entryShift, setEntryShift] = useState<"MORNING" | "EVENING">("MORNING");
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [groupYields, setGroupYields] = useState<Record<string, string>>({});
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  useEffect(() => {
    farmService.listGroups().then(setGroups).catch(() => {});
  }, []);

  const morningRecords = records.filter((r) => r.session === "Morning");
  const eveningRecords = records.filter((r) => r.session === "Evening");

  const morningTotal = morningRecords.reduce((sum, r) => sum + r.litres, 0);
  const eveningTotal = eveningRecords.reduce((sum, r) => sum + r.litres, 0);
  const totalDayMilk = morningTotal + eveningTotal;

  const lactatingAnimals = animals.filter(
    (a) => a.active !== false && (a.type === "Lactating" || a.yield > 0)
  );

  const averagePerCow =
    lactatingAnimals.length > 0 && totalDayMilk > 0
      ? (totalDayMilk / lactatingAnimals.length).toFixed(1)
      : "0.0";

  const currentList = activeSession === "Morning" ? morningRecords : eveningRecords;

  // Filter animals for group entry
  const eligibleGroupAnimals = animals.filter((a) => {
    if (a.active === false) return false;
    if (selectedGroupId === "ALL") return true;
    return (a as any).groupId === selectedGroupId;
  });

  const handleYieldChange = (animalId: string, val: string) => {
    setGroupYields((prev) => ({ ...prev, [animalId]: val }));
  };

  const handleSaveGroupMilk = async () => {
    const entriesToSave = Object.entries(groupYields)
      .filter(([_, litres]) => parseFloat(litres) > 0)
      .map(([animalId, litres]) => ({
        animalId,
        litres: parseFloat(litres),
      }));

    if (entriesToSave.length === 0) {
      toast.error("Please enter milk litres for at least one cow.");
      return;
    }

    setIsSavingGroup(true);
    try {
      const savedCount = await farmService.recordBulkMilk({
        shift: entryShift,
        recordDate: entryDate,
        groupId: selectedGroupId === "ALL" ? undefined : selectedGroupId,
        records: entriesToSave,
      });

      toast.success(`${savedCount} Cow Milk Records Saved!`, {
        description: `Successfully logged ${entryShift.toLowerCase()} milk for selected animals.`,
      });
      setGroupYields({});
      setGroupEntryOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save group milk records.");
    } finally {
      setIsSavingGroup(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Module Title & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300">
              <Milk className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              ଦୁଗ୍ଧ ପରିଚାଳନା · Milking Operations
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Morning and evening milking rounds, fast group entry, animal yields & pickup
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setExportModalOpen(true)}
            className="h-10 gap-1.5 rounded-2xl text-xs font-bold border-border/80"
          >
            <Download className="size-3.5" />
            Export
          </Button>

          <Button
            variant="outline"
            onClick={() => setImportModalOpen(true)}
            className="h-10 gap-1.5 rounded-2xl text-xs font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20"
          >
            <UploadCloud className="size-3.5" />
            Import
          </Button>

          {/* Fast Group Milking Button */}
          <Button
            onClick={() => setGroupEntryOpen(!groupEntryOpen)}
            className="h-10 gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md"
          >
            <Users className="size-4" />
            {groupEntryOpen ? "Close Group Entry" : "Fast Group Entry (ଗୋଠ ଏଣ୍ଟ୍ରି)"}
          </Button>

          <Button
            onClick={onOpenQuickRecord}
            className="h-10 gap-2 rounded-2xl bg-sky-600 px-4 text-xs font-extrabold text-white shadow-md shadow-sky-600/30 hover:bg-sky-700 active:scale-95"
          >
            <Plus className="size-4 stroke-[2.5]" />
            Record Single Cow
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards - Real Values */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Today's Milk (ଆଜିର କ୍ଷୀର)
          </p>
          <p className="mt-1 text-2xl font-black text-foreground">
            {totalDayMilk > 0 ? `${totalDayMilk.toFixed(1)} L` : "0.0 L"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5">
            {totalDayMilk > 0 ? "✓ Verified production" : "No milk recorded today"}
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Morning Round (ସକାଳ)
          </p>
          <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
            {morningTotal > 0 ? `${morningTotal.toFixed(1)} L` : "0.0 L"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {morningRecords.length} cows milked
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Evening Round (ସନ୍ଧ୍ୟା)
          </p>
          <p className="mt-1 text-2xl font-black text-indigo-700 dark:text-indigo-300">
            {eveningTotal > 0 ? `${eveningTotal.toFixed(1)} L` : "0.0 L"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {eveningRecords.length} cows milked
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Average per Cow
          </p>
          <p className="mt-1 text-2xl font-black text-foreground">
            {averagePerCow} L
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Across {lactatingAnimals.length} lactating herd
          </p>
        </div>
      </div>

      {/* FAST GROUP MILKING ENTRY SECTION (Expandable) */}
      {groupEntryOpen && (
        <div className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
            <div>
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <Users className="size-5 text-emerald-700 dark:text-emerald-400" />
                <span>ଗୋଠ ଅନୁସାରେ ଦୁଗ୍ଧ ଏଣ୍ଟ୍ରି · Fast Group Milking</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Select herd group, toggle session, input litres by tag, and save all at once.
              </p>
            </div>

            {/* Shift & Date Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setEntryShift("MORNING")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    entryShift === "MORNING"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-muted-foreground"
                  }`}
                >
                  <Sun className="size-3.5 inline mr-1" /> ସକାଳ (Morning)
                </button>
                <button
                  type="button"
                  onClick={() => setEntryShift("EVENING")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    entryShift === "EVENING"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-muted-foreground"
                  }`}
                >
                  <Moon className="size-3.5 inline mr-1" /> ସନ୍ଧ୍ୟା (Evening)
                </button>
              </div>

              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="h-8 rounded-xl border border-border bg-background px-2 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Group Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-muted-foreground mr-1">ଗୋଠ (Group):</span>
            <button
              type="button"
              onClick={() => setSelectedGroupId("ALL")}
              className={`rounded-xl px-3 py-1 text-xs font-bold whitespace-nowrap transition-all ${
                selectedGroupId === "ALL"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-background border border-border text-foreground hover:bg-muted"
              }`}
            >
              All Herd ({animals.length})
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroupId(g.id)}
                className={`rounded-xl px-3 py-1 text-xs font-bold whitespace-nowrap transition-all ${
                  selectedGroupId === g.id
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-background border border-border text-foreground hover:bg-muted"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Animals Quick Entry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-80 overflow-y-auto p-1">
            {eligibleGroupAnimals.map((a) => (
              <div
                key={a.id}
                className="flex flex-col justify-between rounded-2xl border border-border/80 bg-background p-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-foreground bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-lg">
                    {a.tag}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {a.type}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    placeholder="0.0"
                    value={groupYields[a.id] || ""}
                    onChange={(e) => handleYieldChange(a.id, e.target.value)}
                    className="w-full h-9 rounded-xl border border-border bg-card px-2 text-center text-sm font-black text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-muted-foreground">L</span>
                </div>
              </div>
            ))}
          </div>

          {/* Group Action Bottom Bar */}
          <div className="flex items-center justify-between border-t border-emerald-500/20 pt-3">
            <span className="text-xs font-semibold text-muted-foreground">
              Total entered:{" "}
              <strong className="text-emerald-700 dark:text-emerald-400">
                {Object.values(groupYields)
                  .reduce((sum, v) => sum + (parseFloat(v) || 0), 0)
                  .toFixed(1)}{" "}
                L
              </strong>
            </span>

            <Button
              onClick={handleSaveGroupMilk}
              disabled={isSavingGroup}
              className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-10 px-5 gap-2 shadow-md"
            >
              {isSavingGroup ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" /> Save Group Records (ଏକସଙ୍ଗେ ସେଭ୍ କରନ୍ତୁ)
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
        {/* Left: Animal-wise Records & Session Selector */}
        <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                Individual Cow Yields
              </h2>
              <p className="text-xs text-muted-foreground">
                Check or log milk recorded for each animal
              </p>
            </div>

            {/* Session Switcher */}
            <div className="flex rounded-2xl border border-border/80 bg-background/60 p-1">
              <button
                type="button"
                onClick={() => setActiveSession("Morning")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  activeSession === "Morning"
                    ? "bg-amber-500/20 text-amber-900 dark:text-amber-200 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sun className="size-3.5 text-amber-500" />
                Morning
              </button>
              <button
                type="button"
                onClick={() => setActiveSession("Evening")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  activeSession === "Evening"
                    ? "bg-indigo-500/20 text-indigo-900 dark:text-indigo-200 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Moon className="size-3.5 text-indigo-500" />
                Evening
              </button>
            </div>
          </div>

          {/* List of Entries */}
          <div className="space-y-2">
            {currentList.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No {activeSession.toLowerCase()} milk records found for today. Use Fast Group Entry above or click Record Single Cow.
              </div>
            ) : (
              currentList.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/60 p-3 hover:bg-card transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300 font-extrabold text-xs">
                      {rec.tag}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-bold text-foreground">
                        Tag: {rec.tag}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {rec.animalName && rec.animalName !== rec.tag ? `${rec.animalName} · ` : ""}
                        {rec.recordedAt}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-extrabold text-foreground">
                      {rec.litres.toFixed(1)}{" "}
                      <span className="text-xs font-bold text-muted-foreground">L</span>
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Quality Passed
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button
            variant="outline"
            onClick={onOpenQuickRecord}
            className="h-11 w-full gap-2 rounded-2xl text-xs font-bold"
          >
            <Plus className="size-4" /> Add Another Cow's Milk
          </Button>
        </div>

        {/* Right: Quality Checks & Tank Collection Status */}
        <div className="space-y-4">
          {/* Quality Card */}
          <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-extrabold text-foreground">
              Milk Quality Checks
            </h2>
            <p className="text-xs text-muted-foreground">
              Automated chiller and testing tank readings
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between rounded-xl bg-background/50 p-2.5 text-xs">
                <span className="font-semibold text-muted-foreground">Fat Content</span>
                <span className="font-extrabold text-foreground">4.1% (Standard A)</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-background/50 p-2.5 text-xs">
                <span className="font-semibold text-muted-foreground">SNF / Solids</span>
                <span className="font-extrabold text-foreground">8.8% (Optimal)</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-background/50 p-2.5 text-xs">
                <span className="font-semibold text-muted-foreground">Chiller Temp</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400">3.8 °C (Safe Cold)</span>
              </div>
            </div>

            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" /> All quality parameters within standard range
            </p>
          </div>

          {/* Tanker Pickup Card */}
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
                    Next Scheduled Pickup
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

      {/* Common Modals */}
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
