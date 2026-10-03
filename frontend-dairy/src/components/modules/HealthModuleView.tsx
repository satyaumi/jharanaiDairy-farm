import React from "react";
import {
  HeartPulse,
  Plus,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  Clock3,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Animal } from "@/types/farm";

interface HealthModuleViewProps {
  animals: Animal[];
  onOpenQuickHealth: () => void;
  onSelectAnimal: (animal: Animal) => void;
}

export function HealthModuleView({
  animals,
  onOpenQuickHealth,
  onSelectAnimal,
}: HealthModuleViewProps) {
  const sickAnimals = animals.filter(
    (a) => a.status === "Sick" || a.status === "Needs check"
  );
  const healthyCount = animals.filter((a) => a.status === "Healthy").length;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-rose-500/15 text-rose-800 dark:text-rose-300">
              <HeartPulse className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Herd Health & Veterinary Care
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Follow up on sick animals, vaccinations, recovery pen & routine vet visits
          </p>
        </div>

        <Button
          onClick={onOpenQuickHealth}
          className="h-11 gap-2 rounded-2xl bg-rose-600 px-4 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-rose-600/30 hover:bg-rose-700 active:scale-95"
        >
          <Plus className="size-4.5 stroke-[2.5]" />
          Record Health Check
        </Button>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Healthy Animals
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {healthyCount}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">In active production</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Needs Attention
          </p>
          <p className="mt-1 text-2xl font-extrabold text-destructive">
            {sickAnimals.length}
          </p>
          <p className="mt-1 text-[10px] text-destructive/80 font-bold">
            Daily follow-up
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Vaccines Due
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700 dark:text-amber-300">
            5
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Next 7 days schedule
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Recovery Pen
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">
            2 Cows
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Under antibiotic rest
          </p>
        </div>
      </div>

      {/* Urgent Sick Animals Banner */}
      {sickAnimals.length > 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <p className="text-sm font-extrabold">
              {sickAnimals.length} animals currently require health follow-ups
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {sickAnimals.map((animal) => (
              <div
                key={animal.id}
                onClick={() => onSelectAnimal(animal)}
                className="flex items-center justify-between rounded-xl border border-border/80 bg-background/80 p-3 hover:bg-background cursor-pointer transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-xs text-foreground">
                      {animal.name}
                    </p>
                    <span className="rounded bg-secondary px-1.5 py-0.2 text-[10px] font-bold text-secondary-foreground">
                      {animal.tag}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Pen: {animal.pen} · {animal.type}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  Inspect
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Vaccination Schedule & Recent History */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Vaccinations */}
        <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-foreground">
              Upcoming Herd Vaccinations
            </h2>
            <ShieldCheck className="size-4 text-teal-600" />
          </div>

          <div className="space-y-2.5">
            {[
              { name: "FMD (Foot & Mouth) Booster", count: "18 animals", date: "Tomorrow · 9:00 am", level: "Important" },
              { name: "Clostridial 8-way Vaccine", count: "5 heifers", date: "Oct 5", level: "Scheduled" },
              { name: "Deworming Bolus Course", count: "Whole herd", date: "Oct 15", level: "Planned" },
            ].map((v) => (
              <div
                key={v.name}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/60 p-3"
              >
                <div>
                  <p className="text-xs font-extrabold text-foreground">{v.name}</p>
                  <p className="text-[11px] text-muted-foreground">{v.count} · {v.date}</p>
                </div>
                <span className="rounded-full bg-teal-500/15 px-2.5 py-0.5 text-[10px] font-bold text-teal-800 dark:text-teal-300">
                  {v.level}
                </span>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={onOpenQuickHealth}
            className="h-10 w-full gap-2 rounded-2xl text-xs font-bold"
          >
            <Plus className="size-4" /> Log Completed Vaccine Batch
          </Button>
        </div>

        {/* Recent Health History Log */}
        <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-foreground">
              Recent Health Log
            </h2>
            <Clock3 className="size-4 text-muted-foreground" />
          </div>

          <div className="space-y-2.5">
            {[
              { cow: "Fern (C-1007)", action: "Fever check (39.2°C) & isolated to recovery", time: "Today · 6:30 am", badge: "Treatment" },
              { cow: "Clover (C-1018)", action: "Hoof zinc sulphate spray treatment", time: "Yesterday", badge: "Hoof care" },
              { cow: "Willow (C-1041)", action: "Pre-calving pelvic ligament check passed", time: "2 days ago", badge: "Calving prep" },
            ].map((h) => (
              <div
                key={h.cow}
                className="rounded-2xl border border-border/70 bg-card/60 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-foreground">{h.cow}</p>
                  <span className="rounded-full bg-secondary px-2 py-0.2 text-[10px] font-bold text-secondary-foreground">
                    {h.badge}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{h.action}</p>
                <p className="mt-1 text-[10px] font-semibold text-muted-foreground/80">{h.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
