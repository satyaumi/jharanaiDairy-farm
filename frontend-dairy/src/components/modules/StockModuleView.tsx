import React from "react";
import {
  Package,
  Plus,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StockItem } from "@/types/farm";

interface StockModuleViewProps {
  stockItems: StockItem[];
  onOpenQuickStock: () => void;
}

export function StockModuleView({
  stockItems,
  onOpenQuickStock,
}: StockModuleViewProps) {
  const lowStockCount = stockItems.filter((s) => s.trend === "low").length;
  const totalWeightKg = stockItems
    .filter((s) => s.unit === "kg")
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-500/15 text-cyan-800 dark:text-cyan-300">
              <Package className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Feed & Inventory Stock
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Monitor available feed, fodder silage, supplements & order thresholds
          </p>
        </div>

        <Button
          onClick={onOpenQuickStock}
          className="h-11 gap-2 rounded-2xl bg-cyan-600 px-4 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-cyan-600/30 hover:bg-cyan-700 active:scale-95"
        >
          <Plus className="size-4.5 stroke-[2.5]" />
          Record Stock Entry
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Feed & Fodder
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">
            {totalWeightKg.toLocaleString()} kg
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">In barn storage</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Low Stock Alerts
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700 dark:text-amber-300">
            {lowStockCount} Items
          </p>
          <p className="mt-1 text-[10px] text-amber-800 font-bold dark:text-amber-300">
            Reorder recommended
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Items Tracked
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">
            {stockItems.length} Products
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Across 3 categories</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Last Restock
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            Today
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Dry hay (+240 kg)</p>
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stockItems.map((item) => {
          const isLow = item.trend === "low";
          return (
            <div
              key={item.id}
              className={`rounded-3xl border p-4 transition-all ${
                isLow
                  ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500"
                  : "border-border/70 bg-card/60 hover:bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-500/15 text-cyan-800 dark:text-cyan-300">
                    <Package className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-sm font-extrabold text-foreground">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Category: {item.category}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    isLow
                      ? "bg-amber-500/20 text-amber-900 dark:text-amber-200"
                      : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                  }`}
                >
                  {isLow ? "Low Stock" : "In Stock"}
                </span>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <p className="text-2xl font-extrabold text-foreground">
                  {item.amount.toLocaleString()}{" "}
                  <span className="text-xs font-bold text-muted-foreground">
                    {item.unit}
                  </span>
                </p>
                <p className="text-xs font-bold text-muted-foreground">
                  {item.percent}% Capacity
                </p>
              </div>

              {/* Capacity Bar */}
              <div className="mt-2 h-2.5 rounded-full bg-secondary/80 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isLow ? "bg-amber-500" : "bg-emerald-600"
                  }`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>

              <p className="mt-2 text-[10px] text-muted-foreground">
                Minimum buffer threshold: {item.minThreshold} {item.unit}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Stock In / Out Log */}
      <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-foreground">
            Recent Stock Activity Log
          </h2>
          <ClipboardList className="size-4 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          {[
            { item: "Rhodes Grass Dry Hay", type: "Stock In (Delivered)", qty: "+240 kg", time: "Today · 7:20 am", positive: true },
            { item: "Green Napier Fodder", type: "Stock Out (Fed to herd)", qty: "−620 kg", time: "Today · 6:30 am", positive: false },
            { item: "Dairy Concentrate (20% CP)", type: "Stock Out (Parlor feed)", qty: "−245 kg", time: "Today · 6:30 am", positive: false },
            { item: "Calf Starter Pellet", type: "Stock In (Purchase)", qty: "+150 kg", time: "Yesterday · 4:00 pm", positive: true },
          ].map((act, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-3 text-xs"
            >
              <div className="min-w-0">
                <p className="font-bold text-foreground truncate">{act.item}</p>
                <p className="text-[11px] text-muted-foreground">
                  {act.type} · {act.time}
                </p>
              </div>

              <span
                className={`font-extrabold text-sm shrink-0 flex items-center gap-1 ${
                  act.positive
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-foreground"
                }`}
              >
                {act.positive ? (
                  <ArrowUpRight className="size-3.5" />
                ) : (
                  <ArrowDownRight className="size-3.5 text-muted-foreground" />
                )}
                {act.qty}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
