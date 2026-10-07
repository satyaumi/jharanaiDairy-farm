import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  HeartPulse,
  Milk,
  ShieldCheck,
  Wheat,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  Info,
  Users,
  Edit3,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { CowIcon } from "@/components/common/CowBrandLogo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type {
  Animal,
  TimelineEvent,
  AnimalMilkRecordItem,
  AnimalFeedRecordItem,
} from "@/types/farm";
import { ExportRecordsButton } from "@/components/common/ExportRecordsButton";
import { farmService } from "@/services/farm-service";

interface AnimalProfileModalProps {
  animal: Animal | null;
  onOpenChange: (open: boolean) => void;
  onRecordMilk?: (animal: Animal) => void;
  onEditAnimal?: (animal: Animal) => void;
  onLifecycleChange?: (animal: Animal) => void;
}

type TabType =
  | "basic"
  | "yielding"
  | "breeding"
  | "health"
  | "feeding"
  | "vaccination"
  | "history";

export function AnimalProfileModal({
  animal,
  onOpenChange,
  onRecordMilk,
  onEditAnimal,
  onLifecycleChange,
}: AnimalProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [milkRecords, setMilkRecords] = useState<AnimalMilkRecordItem[]>([]);
  const [feedRecords, setFeedRecords] = useState<AnimalFeedRecordItem[]>([]);
  const [historyEvents, setHistoryEvents] = useState<TimelineEvent[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Fetch real database records when animal changes
  useEffect(() => {
    if (animal?.id) {
      setLoadingRecords(true);
      Promise.all([
        farmService.getAnimalMilkRecords(animal.id),
        farmService.getAnimalFeedRecords(animal.id),
        farmService.getAnimalHistory(animal.id),
      ])
        .then(([milks, feeds, history]) => {
          setMilkRecords(milks);
          setFeedRecords(feeds);
          setHistoryEvents(
            history.length > 0 ? history : (animal.timeline || []),
          );
        })
        .catch(() => {
          setHistoryEvents(animal.timeline || []);
        })
        .finally(() => {
          setLoadingRecords(false);
        });
    }
  }, [animal?.id, animal?.timeline]);

  if (!animal) return null;

  const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: "basic", label: "Basic Info", icon: Info },
    { id: "yielding", label: "Yielding", icon: Milk },
    { id: "breeding", label: "Breeding", icon: Calendar },
    { id: "health", label: "Health", icon: HeartPulse },
    { id: "feeding", label: "Feeding", icon: Wheat },
    { id: "vaccination", label: "Vaccination", icon: ShieldCheck },
    { id: "history", label: "History", icon: Clock },
  ];

  const lifecycle = animal.lifecycleStatus || (animal.active === false ? "ARCHIVED" : "ACTIVE");
  const isInactive =
    lifecycle === "DECEASED" ||
    lifecycle === "SOLD" ||
    lifecycle === "RETIRED" ||
    lifecycle === "ARCHIVED";

  // Calculations from actual milk records if present
  const morningLitres = milkRecords
    .filter((m) => m.shift === "Morning")
    .reduce((sum, m) => sum + (m.litres || 0), 0);
  const eveningLitres = milkRecords
    .filter((m) => m.shift === "Evening")
    .reduce((sum, m) => sum + (m.litres || 0), 0);

  return (
    <Dialog open={Boolean(animal)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-3xl border-border/80 bg-background/95 p-4 sm:p-6">
        {/* Header with Cow Visual & Status */}
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-50/80 shadow-sm dark:bg-emerald-950/40">
                <CowIcon className="size-9" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <span className="font-black text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-xl">
                      {animal.tag}
                    </span>
                    {animal.name && animal.name !== animal.tag && (
                      <span className="text-sm font-semibold text-muted-foreground">
                        ({animal.name})
                      </span>
                    )}
                  </DialogTitle>
                  {lifecycle !== "ACTIVE" && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        lifecycle === "DECEASED"
                          ? "bg-destructive/15 text-destructive"
                          : lifecycle === "SOLD"
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {lifecycle}
                    </span>
                  )}
                </div>
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                  {animal.breed} · {animal.age || "Age not set"} · Pen: {animal.pen || "Unassigned"}
                </DialogDescription>
              </div>
            </div>

            {/* Actions: Edit, Status & Export */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5">
                {onEditAnimal && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditAnimal(animal)}
                    className="h-7 px-2.5 text-[11px] font-bold rounded-lg border-border/80 gap-1"
                  >
                    <Edit3 className="size-3" />
                    Edit
                  </Button>
                )}
                {onLifecycleChange && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onLifecycleChange(animal)}
                    className="h-7 px-2 text-[11px] font-bold rounded-lg border-border/80 text-muted-foreground gap-1"
                  >
                    <ShieldAlert className="size-3" />
                    Status
                  </Button>
                )}
              </div>
              <ExportRecordsButton
                cowTag={animal.tag}
                module="milk"
                label="Download Record"
                size="sm"
                className="h-7 px-2 text-[10px] rounded-lg border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 shadow-none font-bold"
              />
            </div>
          </div>

          {/* Inactive Animal Banner */}
          {isInactive && (
            <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>
                  This animal is marked as <strong>{lifecycle}</strong>
                  {animal.lifecycleDate ? ` on ${animal.lifecycleDate}` : ""}.
                </span>
              </div>
              {animal.lifecycleReason && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Reason: {animal.lifecycleReason}
                </p>
              )}
            </div>
          )}
        </DialogHeader>

        {/* Tab Bar (Scrollable for Mobile) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-border/40 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        <div className="pt-2">
          {/* 1. BASIC INFO */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5">
                  <p className="text-[10px] font-extrabold uppercase text-muted-foreground">
                    Breed
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {animal.breed}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5">
                  <p className="text-[10px] font-extrabold uppercase text-muted-foreground">
                    Age
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {animal.age || "Not specified"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5">
                  <p className="text-[10px] font-extrabold uppercase text-muted-foreground">
                    Current Weight
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {animal.weight && animal.weight > 0
                      ? `${animal.weight} kg`
                      : "Not weighed yet"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5">
                  <p className="text-[10px] font-extrabold uppercase text-muted-foreground">
                    Current Pen
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {animal.pen || "Unassigned"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5">
                  <p className="text-[10px] font-extrabold uppercase text-muted-foreground">
                    Lactation Cycle
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    Cycle {animal.lactationCycle || 1}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5">
                  <p className="text-[10px] font-extrabold uppercase text-muted-foreground">
                    Recorded Yield
                  </p>
                  <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {animal.yield > 0
                      ? `${animal.yield.toFixed(1)} L`
                      : "0 L (Dry / Young)"}
                  </p>
                </div>
              </div>

              {/* Farmer Quick Actions */}
              <div className="flex gap-2">
                {!isInactive && animal.type === "Lactating" && onRecordMilk && (
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      onRecordMilk(animal);
                    }}
                    className="h-11 flex-1 gap-2 rounded-2xl bg-emerald-600 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700"
                  >
                    <Milk className="size-4" />
                    Record Milking Round
                  </Button>
                )}
                {onEditAnimal && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      onEditAnimal(animal);
                    }}
                    className="h-11 gap-2 rounded-2xl text-xs sm:text-sm font-bold border-border/80"
                  >
                    <Edit3 className="size-4" />
                    Edit Animal Record
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 2. YIELDING (REAL DATABASE-DRIVEN) */}
          {activeTab === "yielding" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">
                      Today's Stored Yield
                    </p>
                    <p className="text-2xl font-extrabold text-foreground">
                      {animal.yield > 0
                        ? `${animal.yield.toFixed(1)} Litres`
                        : "0 Litres (Dry / Calf)"}
                    </p>
                  </div>
                  <div className="grid size-10 place-items-center rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300">
                    <Milk className="size-5" />
                  </div>
                </div>

                {/* Real morning / evening draw from recorded entries if available */}
                {(morningLitres > 0 || eveningLitres > 0) && (
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Morning Recorded
                      </p>
                      <p className="text-base font-bold text-foreground">
                        {morningLitres > 0 ? `${morningLitres.toFixed(1)} L` : "0 L"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Evening Recorded
                      </p>
                      <p className="text-base font-bold text-foreground">
                        {eveningLitres > 0 ? `${eveningLitres.toFixed(1)} L` : "0 L"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Milking Entries List from PostgreSQL */}
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <h4 className="text-xs font-bold text-foreground">
                    Milking Log Entries ({milkRecords.length})
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    From herd records
                  </span>
                </div>

                {loadingRecords ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-emerald-600" />
                    Loading milk logs...
                  </div>
                ) : milkRecords.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No milking entries recorded for this animal yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {milkRecords.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-2.5 text-xs"
                      >
                        <div>
                          <p className="font-bold text-foreground">
                            {m.shift} Milking: {m.litres} L
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Date: {m.recordDate} · Quality: {m.quality || "Normal"}
                          </p>
                        </div>
                        {m.fatPercentage && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {m.fatPercentage}% Fat
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. BREEDING (REAL DATABASE-DRIVEN) */}
          {activeTab === "breeding" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">
                      Reproduction & Pregnancy Status
                    </p>
                    <p className="text-lg font-extrabold text-foreground">
                      {animal.dueDate
                        ? `Pregnant · Calving Expected on ${animal.dueDate}`
                        : animal.type === "Pregnant"
                        ? "Pregnant · Confirmed"
                        : "Open / Insemination window open"}
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300">
                    <Calendar className="size-5" />
                  </span>
                </div>
                {animal.dueDate && (
                  <div className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                    Expected Calving: <strong>{animal.dueDate}</strong>. Transition
                    to calving pen with straw bedding prior to due date.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2">
                <p className="text-xs font-bold text-foreground pb-1 border-b border-border/60">
                  Recorded Breeding Details
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">
                      Artificial Insemination (AI) Date:
                    </span>
                    <span className="font-semibold text-foreground">
                      {animal.aiDate || "No AI date recorded"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Sire (Bull / Father):</span>
                    <span className="font-semibold text-foreground">
                      {animal.fatherTag
                        ? `${animal.fatherTag}${animal.fatherName ? ` (${animal.fatherName})` : ""}`
                        : "Unknown / Not recorded"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Dam (Mother):</span>
                    <span className="font-semibold text-foreground">
                      {animal.motherTag
                        ? `${animal.motherTag}${animal.motherName ? ` (${animal.motherName})` : ""}`
                        : "Unknown / Not recorded"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. HEALTH (REAL DATABASE-DRIVEN) */}
          {activeTab === "health" && (
            <div className="space-y-4">
              <div
                className={`rounded-2xl border p-4 ${
                  animal.status === "Sick"
                    ? "border-destructive/30 bg-destructive/5"
                    : animal.status === "Needs check"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-emerald-500/30 bg-emerald-500/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-10 place-items-center rounded-xl ${
                      animal.status === "Sick"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                    }`}
                  >
                    <HeartPulse className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">
                      Overall Herd Health Condition
                    </p>
                    <p className="text-base font-extrabold text-foreground">
                      {animal.status}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {animal.status === "Sick"
                    ? "Currently placed in isolation or recovery pen. Monitor feed intake and vital signs."
                    : animal.status === "Needs check"
                    ? "Scheduled for physical veterinary examination."
                    : "Active in normal herd routine."}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2">
                <p className="text-xs font-bold text-foreground pb-1 border-b border-border/60">
                  Health & Veterinary Observations
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Last Health Check:</span>
                    <span className="font-semibold text-foreground">
                      {animal.lastHealthCheck || "No vet inspection date logged"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Recovery Pen:</span>
                    <span className="font-semibold text-foreground">
                      {animal.status === "Sick" ? "Assigned" : "Not required"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. FEEDING (REAL DATABASE-DRIVEN) */}
          {activeTab === "feeding" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <p className="text-xs font-bold text-muted-foreground">
                  Prescribed Daily Ration
                </p>
                <p className="mt-1 text-base font-extrabold text-foreground">
                  {animal.feedRation || "No specific individual ration prescribed"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Clean drinking water and mineral supplement ad-libitum.
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <p className="text-xs font-bold text-foreground">
                    Feeding Log Entries ({feedRecords.length})
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    Recorded in barn
                  </span>
                </div>

                {loadingRecords ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-emerald-600" />
                    Loading feed logs...
                  </div>
                ) : feedRecords.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No individual feeding logs recorded yet for this animal.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {feedRecords.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-2.5 text-xs"
                      >
                        <div>
                          <p className="font-bold text-foreground">
                            {f.feedType}: {f.quantityKg} kg
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Date: {f.recordDate} · Group: {f.groupName}
                          </p>
                        </div>
                        {f.recordedBy && (
                          <span className="text-[10px] text-muted-foreground">
                            By: {f.recordedBy}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. VACCINATION (REAL DATABASE-DRIVEN) */}
          {activeTab === "vaccination" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">
                      Latest Known Vaccination Date
                    </p>
                    <p className="text-base font-extrabold text-foreground">
                      {animal.lastVaccinationDate || "No vaccination recorded"}
                    </p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-xl bg-teal-500/15 text-teal-800 dark:text-teal-300">
                    <ShieldCheck className="size-5" />
                  </span>
                </div>
              </div>

              {/* Real vaccination timeline events */}
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-3">
                <p className="text-xs font-bold text-foreground pb-2 border-b border-border/60">
                  Vaccination History
                </p>
                {(() => {
                  const vacEvents = historyEvents.filter(
                    (e) => e.type === "vaccination",
                  );
                  if (vacEvents.length === 0) {
                    return (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No vaccination records entered yet for this animal.
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {vacEvents.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-2.5 text-xs"
                        >
                          <div>
                            <p className="font-bold text-foreground">{v.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {v.detail}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                            {v.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 7. HISTORY & TIMELINE (CHRONOLOGICAL) */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {/* History Overview */}
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Chronological History
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Birth, registrations, inseminations, vaccines & lifecycle changes
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Animal {animal.tag}
                  </span>
                </div>

                {/* Timeline flow */}
                {historyEvents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    History not available yet.
                  </div>
                ) : (
                  <div className="mt-4 relative pl-6 space-y-5 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-border/80">
                    {historyEvents.map((event) => (
                      <div key={event.id} className="relative">
                        <span className={`absolute -left-6 top-0.5 flex size-5 items-center justify-center rounded-full ring-4 ring-background ${
                          event.type === "death"
                            ? "bg-destructive text-white"
                            : event.type === "sale"
                            ? "bg-amber-600 text-white"
                            : "bg-emerald-600 text-white"
                        }`}>
                          <CheckCircle2 className="size-3 stroke-[3]" />
                        </span>
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-foreground">
                              {event.title}
                            </p>
                            <span className="rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                              {event.date}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {event.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
