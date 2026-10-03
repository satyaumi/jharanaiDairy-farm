import React from "react";
import {
  Sprout,
  Plus,
  Tractor,
  Wheat,
  Check,
  Package,
  Milk,
  ArrowRight,
  Calendar,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FodderField } from "@/types/farm";

interface FodderModuleViewProps {
  fields: FodderField[];
  onOpenQuickFodder: () => void;
}

export function FodderModuleView({
  fields,
  onOpenQuickFodder,
}: FodderModuleViewProps) {
  const STAGES = [
    { name: "1. Land Prep", icon: Tractor, desc: "Tillage & soil manuring" },
    { name: "2. Planting", icon: Wheat, desc: "Sowing seed or root slips" },
    { name: "3. Growing", icon: Sprout, desc: "Irrigation & weeding" },
    { name: "4. Harvest", icon: Check, desc: "Cutting at 45-60 days" },
    { name: "5. Silage / Stock", icon: Package, desc: "Chopping & bunker storage" },
    { name: "6. Herd Feeding", icon: Milk, desc: "Chaffed fresh green feed" },
  ];

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-lime-500/15 text-lime-800 dark:text-lime-300">
              <Sprout className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Fodder & Pasture Cultivation
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Plan cultivation fields, follow green fodder growth & manage cutting schedules
          </p>
        </div>

        <Button
          onClick={onOpenQuickFodder}
          className="h-11 gap-2 rounded-2xl bg-lime-600 px-4 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-lime-600/30 hover:bg-lime-700 active:scale-95"
        >
          <Plus className="size-4.5 stroke-[2.5]" />
          Record Fodder Harvest
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Active Plots
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">
            12 Fields
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">10.6 acres under forage</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Growing Crops
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            8 Plots
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Napier & Sorghum</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Harvest Soon
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700 dark:text-amber-300">
            2 Plots
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Ready within 6 days</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Monthly Yield
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">
            18.4 Tonnes
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Sufficient green forage</p>
        </div>
      </div>

      {/* From Field to Feed Lifecycle (Visual Journey for Farm Workers) */}
      <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-foreground">
            From Field to Feed Lifecycle
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Circular dairy forage flow
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 pt-1">
          {STAGES.map((stg, i) => {
            const Icon = stg.icon;
            return (
              <div
                key={stg.name}
                className="flex flex-col items-center rounded-2xl border border-border/70 bg-card/60 p-3 text-center"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-lime-500/15 text-lime-800 dark:text-lime-300">
                  <Icon className="size-5" />
                </span>
                <p className="mt-2 text-xs font-bold text-foreground">
                  {stg.name}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                  {stg.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Field Plots List */}
      <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-foreground">
              Cultivated Field Plots
            </h2>
            <p className="text-xs text-muted-foreground">
              Current growth stages, expected cutting dates & yields
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenQuickFodder}
            className="rounded-xl text-xs font-bold"
          >
            <Plus className="size-3.5 mr-1" /> Add Field Record
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((fld) => (
            <div
              key={fld.id}
              className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/60 p-4 hover:bg-card transition-all sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-extrabold text-foreground">
                    {fld.field}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      fld.stage === "Ready soon"
                        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                        : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                    }`}
                  >
                    {fld.stage}
                  </span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Crop: <strong className="text-foreground">{fld.crop}</strong> · Area: {fld.area} · Planted {fld.planted}
                </p>
              </div>

              <div className="flex items-center justify-between sm:text-right gap-4 border-t border-border/60 pt-2 sm:border-t-0 sm:pt-0">
                <div>
                  <p className="text-[11px] text-muted-foreground">Expected Yield</p>
                  <p className="text-sm font-extrabold text-foreground">
                    {fld.expectedYield}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenQuickFodder}
                  className="h-8 rounded-xl text-xs font-bold"
                >
                  Record Cut
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
