import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MilkRecord, Animal } from "@/types/farm";
import { ExportModal } from "@/components/common/ExportModal";
import { ImportRecordsModal } from "@/components/common/ImportRecordsModal";

interface MilkingModuleViewProps {
  records: MilkRecord[];
  animals: Animal[];
  onOpenQuickRecord: () => void;
  onRecordForAnimal: (animal: Animal) => void;
}

export function MilkingModuleView({
  records,
  animals,
  onOpenQuickRecord,
  onRecordForAnimal,
}: MilkingModuleViewProps) {
  const [activeSession, setActiveSession] = useState<"Morning" | "Evening">("Morning");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const morningRecords = records.filter((r) => r.session === "Morning");
  const eveningRecords = records.filter((r) => r.session === "Evening");

  const morningTotal = morningRecords.reduce((sum, r) => sum + r.litres, 0);
  const eveningTotal = eveningRecords.reduce((sum, r) => sum + r.litres, 0);
  const totalDayMilk = morningTotal + eveningTotal;

  const currentList = activeSession === "Morning" ? morningRecords : eveningRecords;

  return (
    <div className="space-y-4">
      {/* Module Title & Quick Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300">
              <Milk className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Milking Operations
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Morning and evening milking rounds, animal yields & tanker pickup
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setExportModalOpen(true)}
            className="h-11 gap-1.5 rounded-2xl text-xs sm:text-sm font-bold border-border/80"
          >
            <Download className="size-4" />
            Export Milk
          </Button>

          <Button
            variant="outline"
            onClick={() => setImportModalOpen(true)}
            className="h-11 gap-1.5 rounded-2xl text-xs sm:text-sm font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20"
          >
            <UploadCloud className="size-4" />
            Import Excel/CSV
          </Button>

          <Button
            onClick={onOpenQuickRecord}
            className="h-11 gap-2 rounded-2xl bg-sky-600 px-4 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-sky-600/30 hover:bg-sky-700 active:scale-95"
          >
            <Plus className="size-4.5 stroke-[2.5]" />
            Record Milk Round
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Today's Milk
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">
            {totalDayMilk > 0 ? `${totalDayMilk.toFixed(1)} L` : "924 L"}
          </p>
          <p className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
            <TrendingUp className="size-3" /> +4.8% vs last week
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Morning Round
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700 dark:text-amber-300">
            {morningTotal > 0 ? `${morningTotal.toFixed(1)} L` : "472 L"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Completed 6:40 am
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Evening Round
          </p>
          <p className="mt-1 text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">
            {eveningTotal > 0 ? `${eveningTotal.toFixed(1)} L` : "452 L"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Completed 4:25 pm
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Average per Cow
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">
            8.1 L
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Across lactating herd
          </p>
        </div>
      </div>

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
            {currentList.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/60 p-3 hover:bg-card transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300 font-extrabold text-xs">
                    {rec.animalName.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-sm font-bold text-foreground">
                      {rec.animalName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Tag: {rec.tag} · {rec.recordedAt}
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
            ))}
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
