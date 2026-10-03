import React from "react";
import {
  Wheat,
  Plus,
  Leaf,
  Package,
  Activity,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedingModuleViewProps {
  onOpenQuickFeeding: () => void;
}

export function FeedingModuleView({ onOpenQuickFeeding }: FeedingModuleViewProps) {
  const FEED_TYPES = [
    { name: "Green Fodder (Hybrid Napier & Maize)", qty: "620 kg", round: "Morning feed", icon: Leaf, color: "text-emerald-700 bg-emerald-100" },
    { name: "Dry Fodder (Rhodes & Wheat Straw)", qty: "280 kg", round: "Morning feed", icon: Wheat, color: "text-amber-700 bg-amber-100" },
    { name: "Dairy Concentrate Pellet (20% CP)", qty: "245 kg", round: "Milking parlor ration", icon: Package, color: "text-sky-700 bg-sky-100" },
    { name: "Chelated Mineral Mix Supplement", qty: "100 kg", round: "Ration blend", icon: Activity, color: "text-teal-700 bg-teal-100" },
  ];

  const GROUPS = [
    { label: "Milking Herd (High & Mid Yielders)", count: "76 animals", progress: 84, ration: "20 kg Green + 4 kg Pellet / cow" },
    { label: "Dry Cows (Late Gestation)", count: "18 animals", progress: 62, ration: "14 kg Green + Mineral mix" },
    { label: "Young Stock & Growing Heifers", count: "34 animals", progress: 48, ration: "Lucerne hay + Calf starter" },
  ];

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300">
              <Wheat className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Feeding & Ration Management
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Feed used today, green & dry forage rations, and feeding group progress
          </p>
        </div>

        <Button
          onClick={onOpenQuickFeeding}
          className="h-11 gap-2 rounded-2xl bg-amber-600 px-4 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-amber-600/30 hover:bg-amber-700 active:scale-95"
        >
          <Plus className="size-4.5 stroke-[2.5]" />
          Record Feeding Round
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Feed Used Today
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">
            1,245 kg
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Across all pens</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Green Fodder
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            620 kg
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Fresh cut forage</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Concentrate Fed
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700 dark:text-amber-300">
            245 kg
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">In milking parlor</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Water Intake
          </p>
          <p className="mt-1 text-2xl font-extrabold text-sky-700 dark:text-sky-300">
            Clean / Ad-lib
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Automatic troughs</p>
        </div>
      </div>

      {/* Main Grid: Feed Dispatched & Group Progress */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
        {/* Today's Dispatched Feeds */}
        <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                Today's Rations Fed
              </h2>
              <p className="text-xs text-muted-foreground">
                Morning round completed · evening round at 5:00 pm
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              Morning Complete
            </span>
          </div>

          <div className="space-y-2.5">
            {FEED_TYPES.map((feed) => {
              const Icon = feed.icon;
              return (
                <div
                  key={feed.name}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/60 p-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${feed.color}`}>
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-bold text-foreground">
                        {feed.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {feed.round}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base font-extrabold text-foreground shrink-0">
                    {feed.qty}
                  </p>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={onOpenQuickFeeding}
            className="h-11 w-full gap-2 rounded-2xl text-xs font-bold"
          >
            <Plus className="size-4" /> Log Additional Feed Entry
          </Button>
        </div>

        {/* Group Feeding Progress */}
        <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-foreground">
              Feeding Groups Progress
            </h2>
            <Users className="size-4 text-muted-foreground" />
          </div>

          <div className="space-y-4">
            {GROUPS.map((grp) => (
              <div key={grp.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground truncate max-w-[200px]">
                    {grp.label}
                  </span>
                  <span className="font-extrabold text-muted-foreground">
                    {grp.progress}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${grp.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {grp.count} · {grp.ration}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/40 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Worker Note</p>
            <p className="mt-0.5 text-[11px]">
              Ensure dry cow mineral mix is replenished in pen 4 before evening milking begins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
