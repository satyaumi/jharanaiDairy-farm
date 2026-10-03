import React, { useState } from "react";
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
import type { Animal, TimelineEvent } from "@/types/farm";
import { ExportRecordsButton } from "@/components/common/ExportRecordsButton";

interface AnimalProfileModalProps {
  animal: Animal | null;
  onOpenChange: (open: boolean) => void;
  onRecordMilk?: (animal: Animal) => void;
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
}: AnimalProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");

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

  return (
    <Dialog open={Boolean(animal)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-3xl border-border/80 bg-background/95 p-4 sm:p-6">
        {/* Header with Cow Visual & Status */}
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-50/80 shadow-sm dark:bg-emerald-950/40">
                <CowIcon className="size-9" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-extrabold text-foreground">
                    {animal.name}
                  </DialogTitle>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
                    {animal.tag}
                  </span>
                </div>
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                  {animal.breed} · {animal.age} · Pen: {animal.pen}
                </DialogDescription>
              </div>
            </div>

            {/* Status Pills & Download Record */}
            <div className="flex flex-col items-end gap-1.5">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  animal.status === "Healthy"
                    ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {animal.status}
              </span>
              <ExportRecordsButton
                cowTag={animal.tag}
                module="milk"
                label="Download Record"
                size="sm"
                className="h-7 px-2 text-[10px] rounded-lg border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 shadow-none font-bold"
              />
            </div>
          </div>
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
                    {animal.age}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5">
                  <p className="text-[10px] font-extrabold uppercase text-muted-foreground">
                    Current Weight
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {animal.weight ? `${animal.weight} kg` : "Not weighed"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5">
                  <p className="text-[10px] font-extrabold uppercase text-muted-foreground">
                    Current Pen
                  </p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {animal.pen}
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
                    Today's Yield
                  </p>
                  <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {animal.yield > 0
                      ? `${animal.yield.toFixed(1)} L`
                      : "0 L (Dry/Calf)"}
                  </p>
                </div>
              </div>

              {/* Quick Actions Bar */}
              {animal.type === "Lactating" && onRecordMilk && (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onRecordMilk(animal);
                  }}
                  className="h-12 w-full gap-2 rounded-2xl bg-emerald-600 text-sm font-extrabold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700"
                >
                  <Milk className="size-4" />
                  Record Milk for {animal.name}
                </Button>
              )}
            </div>
          )}

          {/* 2. YIELDING */}
          {activeTab === "yielding" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">
                      Today's Total Yield
                    </p>
                    <p className="text-2xl font-extrabold text-foreground">
                      {animal.yield > 0
                        ? `${animal.yield.toFixed(1)} Litres`
                        : "Dry period"}
                    </p>
                  </div>
                  <div className="grid size-10 place-items-center rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300">
                    <Milk className="size-5" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      Morning Draw
                    </p>
                    <p className="text-base font-bold text-foreground">
                      {animal.yield > 0
                        ? `${(animal.yield * 0.52).toFixed(1)} L`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      Evening Draw
                    </p>
                    <p className="text-base font-bold text-foreground">
                      {animal.yield > 0
                        ? `${(animal.yield * 0.48).toFixed(1)} L`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <p className="text-xs font-bold text-foreground">
                  Lactation Insights
                </p>
                <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center justify-between">
                    <span>Average Daily Output:</span>
                    <strong className="text-foreground">
                      {animal.yield > 0
                        ? `${animal.yield.toFixed(1)} L/day`
                        : "0 L"}
                    </strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Lactation Stage:</span>
                    <strong className="text-foreground">
                      Peak Production (Month 3)
                    </strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Milking Quality / Fat:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      4.2% Fat (Grade A)
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. BREEDING */}
          {activeTab === "breeding" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">
                      Breeding & Pregnancy Status
                    </p>
                    <p className="text-lg font-extrabold text-foreground">
                      {animal.dueDate
                        ? `Pregnant · Due on ${animal.dueDate}`
                        : animal.type === "Pregnant"
                          ? "Pregnant · Ultrasound Verified"
                          : "Open / Insemination window open"}
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300">
                    <Calendar className="size-5" />
                  </span>
                </div>
                {animal.dueDate && (
                  <div className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                    Expected Calving: <strong>{animal.dueDate}</strong>.
                    Transition to calving pen with fresh straw bedding 10 days
                    prior.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <p className="text-xs font-bold text-foreground">
                  Breeding Records
                </p>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">
                      Last Insemination:
                    </span>
                    <span className="font-semibold text-foreground">
                      3 months ago (Pedigree Bull HF-902)
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">
                      Pregnancy Check:
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Positive (Veterinary Verified)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Calvings:
                    </span>
                    <span className="font-semibold text-foreground">
                      2 live calves
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. HEALTH */}
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
                      Overall Health
                    </p>
                    <p className="text-base font-extrabold text-foreground">
                      {animal.status}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {animal.status === "Sick"
                    ? "Currently in recovery pen under medication course. Monitor appetite and body temperature."
                    : animal.status === "Needs check"
                      ? "Due for routine hoof and udder inspection today."
                      : "Active, chewing cud normally, clear eyes, stable weight."}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <p className="text-xs font-bold text-foreground">
                  Vital Signs & History
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-background/60 p-2.5">
                    <span className="text-muted-foreground">Temperature:</span>
                    <p className="text-sm font-bold text-foreground">
                      38.6°C (Normal)
                    </p>
                  </div>
                  <div className="rounded-xl bg-background/60 p-2.5">
                    <span className="text-muted-foreground">Rumen Motion:</span>
                    <p className="text-sm font-bold text-foreground">
                      2 / min (Healthy)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. FEEDING */}
          {activeTab === "feeding" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <p className="text-xs font-bold text-muted-foreground">
                  Prescribed Daily Ration
                </p>
                <p className="mt-1 text-base font-extrabold text-foreground">
                  {animal.feedRation ||
                    "18 kg Green Napier + 4 kg Dairy Concentrate"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Includes 100g mineral mixture and clean drinking water
                  ad-libitum.
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <p className="text-xs font-bold text-foreground">
                  Feeding Schedule
                </p>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">
                      Morning (6:30 am):
                    </span>
                    <span className="font-semibold text-foreground">
                      10 kg Green + 2 kg Pellet
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">
                      Afternoon (1:00 pm):
                    </span>
                    <span className="font-semibold text-foreground">
                      Dry Straw + Mineral lick
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Evening (5:00 pm):
                    </span>
                    <span className="font-semibold text-foreground">
                      8 kg Green + 2 kg Pellet
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. VACCINATION */}
          {activeTab === "vaccination" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <p className="text-xs font-bold text-foreground">
                  Vaccination Schedule & Status
                </p>
                <div className="mt-3 space-y-2.5">
                  {(
                    animal.vaccinations || [
                      {
                        name: "FMD (Foot & Mouth) Booster",
                        date: "Jan 15",
                        status: "Done",
                      },
                      {
                        name: "Blackquarter & HS Dual",
                        date: "Apr 20",
                        status: "Done",
                      },
                      {
                        name: "Brucellosis S19",
                        date: "May 10",
                        status: "Done",
                      },
                      {
                        name: "Anthrax Spore Vaccine",
                        date: "Nov 15",
                        status: "Due",
                      },
                    ]
                  ).map((v) => (
                    <div
                      key={v.name}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-2.5 text-xs"
                    >
                      <div>
                        <p className="font-bold text-foreground">{v.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Date: {v.date}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          v.status === "Done"
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 7. HISTORY & TIMELINE */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {/* History Overview Cards */}
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      History Records
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Foundational background & pedigree information
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Animal {animal.tag}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Birth */}
                  <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                    <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-foreground">
                      <Calendar className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      Birth
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Birth Date:</span>
                        <span className="font-semibold text-foreground">
                          {animal.birthDate || "Not recorded"}
                        </span>
                      </div>
                      {animal.birthStatus && (
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Status:</span>
                          <span className="font-medium text-foreground">
                            {animal.birthStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Parents */}
                  <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                    <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-foreground">
                      <Users className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      Parents
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Father:</span>
                        <span className="font-semibold text-foreground">
                          {animal.fatherTag
                            ? `${animal.fatherTag}${animal.fatherName ? ` (${animal.fatherName})` : ""}`
                            : animal.fatherName || "Unknown / Not recorded"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Mother:</span>
                        <span className="font-semibold text-foreground">
                          {animal.motherTag
                            ? `${animal.motherTag}${animal.motherName ? ` (${animal.motherName})` : ""}`
                            : animal.motherName || "Unknown / Not recorded"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Breeding */}
                  <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                    <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-foreground">
                      <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      Breeding
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>AI Date:</span>
                        <span className="font-semibold text-foreground">
                          {animal.aiDate || "Not recorded"}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Artificial Insemination Date
                      </span>
                    </div>
                  </div>

                  {/* Vaccination */}
                  <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                    <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-foreground">
                      <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      Vaccination
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Last Vaccination:</span>
                        <span className="font-semibold text-foreground">
                          {animal.lastVaccinationDate || "Not recorded"}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Latest registered vaccine date
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Activity Timeline
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Chronological life events & recorded activity
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {(animal.timeline || []).length} recorded
                  </span>
                </div>

                {/* Timeline flow */}
                <div className="mt-4 relative pl-6 space-y-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-border/80">
                  {(animal.timeline || []).map((event) => (
                    <div key={event.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-6 top-0.5 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white ring-4 ring-background">
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
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
