import React from "react";
import {
  Truck,
  Plus,
  Droplets,
  Clock3,
  CheckCircle2,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SupplyModuleViewProps {
  onOpenQuickSupply: () => void;
}

export function SupplyModuleView({ onOpenQuickSupply }: SupplyModuleViewProps) {
  const COLLECTIONS = [
    { session: "Morning Tanker Dispatch", volume: "472 L", time: "8:15 am", status: "Collected", tanker: "Vehicle KA-04-F-8821", temp: "3.6 °C" },
    { session: "Evening Tanker Dispatch", volume: "452 L", time: "4:40 pm", status: "Collected", tanker: "Vehicle KA-04-F-8821", temp: "3.8 °C" },
  ];

  const PAST_DISPATCHES = [
    { date: "Yesterday · Sep 28", total: "916 L", quality: "Grade A (4.1% Fat)" },
    { date: "Sep 27", total: "898 L", quality: "Grade A (4.0% Fat)" },
    { date: "Sep 26", total: "904 L", quality: "Grade A (4.2% Fat)" },
  ];

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-blue-500/15 text-blue-800 dark:text-blue-300">
              <Truck className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Milk Supply & Tanker Dispatch
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Track daily milk collections, cold tank dispatches & commercial quality certificates
          </p>
        </div>

        <Button
          onClick={onOpenQuickSupply}
          className="h-11 gap-2 rounded-2xl bg-blue-600 px-4 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 active:scale-95"
        >
          <Plus className="size-4.5 stroke-[2.5]" />
          Record Milk Dispatch
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Total Dispatched
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">924 L</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Today's collection</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Morning Pickup
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            472 L
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Completed 8:15 am</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Evening Pickup
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            452 L
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Completed 4:40 pm</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Dairy Lab Test
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            Passed
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Zero antibiotic residue</p>
        </div>
      </div>

      {/* Today's Dispatches & History */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Today's Dispatches */}
        <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                Today's Tanker Pickups
              </h2>
              <p className="text-xs text-muted-foreground">
                Dispatches to central dairy processing facility
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              2 of 2 Done
            </span>
          </div>

          <div className="space-y-3">
            {COLLECTIONS.map((c) => (
              <div
                key={c.session}
                className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-foreground">
                    {c.session}
                  </p>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    {c.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <p>Volume: <strong className="text-foreground">{c.volume}</strong></p>
                  <p>Time: <strong className="text-foreground">{c.time}</strong></p>
                  <p>Carrier: <strong className="text-foreground">{c.tanker}</strong></p>
                  <p>Temp: <strong className="text-emerald-700 dark:text-emerald-400">{c.temp}</strong></p>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={onOpenQuickSupply}
            className="h-11 w-full gap-2 rounded-2xl text-xs font-bold"
          >
            <Plus className="size-4" /> Log Additional Pickup
          </Button>
        </div>

        {/* Dispatch History */}
        <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="text-base font-extrabold text-foreground">
              Recent Dispatch Log
            </h2>
            <Clock3 className="size-4 text-muted-foreground" />
          </div>

          <div className="space-y-2.5">
            {PAST_DISPATCHES.map((d) => (
              <div
                key={d.date}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-3 text-xs"
              >
                <div>
                  <p className="font-extrabold text-foreground">{d.date}</p>
                  <p className="text-[11px] text-muted-foreground">{d.quality}</p>
                </div>
                <p className="text-sm font-extrabold text-foreground">{d.total}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
