import React from "react";
import {
  Milestone,
  Milk,
  BarChart3,
  HeartPulse,
  Wheat,
  Package,
  Sprout,
  Truck,
  Tractor,
  Leaf,
  ShoppingBag,
  Users,
  DollarSign,
  Receipt,
  Settings2,
  X,
  Lock,
  Award,
} from "lucide-react";
import { CowIcon } from "@/components/common/CowBrandLogo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ModulesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectModule: (moduleId: string) => void;
  currentModule: string;
}

export const CORE_MODULES = [
  {
    id: "animals",
    title: "Animals",
    subtitle: "Herd records, breeds, health & lactation",
    icon: CowIcon,
    isCustomIcon: true,
    badge: "128 Head",
    color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  },
  {
    id: "performance",
    title: "Cow Performance",
    subtitle: "Automatic milk grading (Excellent, A to F)",
    icon: Award,
    badge: "Grades A–F",
    color: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  },
  {
    id: "milking",
    title: "Milking",
    subtitle: "Morning & evening animal yield rounds",
    icon: Milk,
    badge: "924 L today",
    color: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30",
  },
  {
    id: "equipment",
    title: "Equipment",
    subtitle: "Milking machines, chillers & tractors",
    icon: Tractor,
    badge: "6 Units",
    color: "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30",
  },
  {
    id: "production",
    title: "Production",
    subtitle: "Daily trends, target yields & averages",
    icon: BarChart3,
    badge: "+4.8%",
    color: "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30",
  },
  {
    id: "health",
    title: "Health",
    subtitle: "Sick animals, hoof care & vaccinations",
    icon: HeartPulse,
    badge: "3 Attention",
    color: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30",
  },
  {
    id: "feeding",
    title: "Feeding",
    subtitle: "Daily ration, concentrate & green forage",
    icon: Wheat,
    badge: "1,245 kg",
    color: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
  },
  {
    id: "stock",
    title: "Stock",
    subtitle: "Inventory, storage levels & restock alerts",
    icon: Package,
    badge: "2 Low",
    color: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30",
  },
  {
    id: "fodder",
    title: "Fodder",
    subtitle: "Land plots, crops & harvest cycles",
    icon: Sprout,
    badge: "12 Fields",
    color: "bg-lime-500/15 text-lime-800 dark:text-lime-300 border-lime-500/30",
  },
  {
    id: "supply",
    title: "Supply",
    subtitle: "Dairy tanker dispatch & milk collections",
    icon: Truck,
    badge: "2 Pickups",
    color: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30",
  },
];

export const FUTURE_MODULES = [
  { id: "bio", title: "Bio Products", subtitle: "Gobar gas, manure & compost processing", icon: Leaf },
  { id: "procurement", title: "Procurement", subtitle: "Vendor feeds, supplements & vet supplies", icon: ShoppingBag },
  { id: "customers", title: "Customers", subtitle: "Direct milk buyers & commercial dairies", icon: Users },
  { id: "sales", title: "Sales & Invoicing", subtitle: "Daily billing & customer ledgers", icon: DollarSign },
  { id: "expenses", title: "Expenses", subtitle: "Labour, feed, diesel & maintenance costs", icon: Receipt },
  { id: "advanced", title: "Advanced Farm Mgmt", subtitle: "Breeding genetics, RFID & smart collars", icon: Settings2 },
];

export function ModulesDrawer({
  open,
  onOpenChange,
  onSelectModule,
  currentModule,
}: ModulesDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto rounded-3xl border-border/80 bg-background/95 p-4 sm:p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
          <div>
            <DialogTitle className="text-xl font-extrabold text-foreground">
              Farm Modules
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Direct access to all 8 operational dairy modules
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* 1. Core Modules (Daily Work) */}
        <div className="space-y-3 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Core Dairy Operations
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {CORE_MODULES.map((mod) => {
              const isSelected = currentModule === mod.id;
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    onSelectModule(mod.id);
                    onOpenChange(false);
                  }}
                  className={`group flex items-start gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 dark:bg-emerald-950/40"
                      : "border-border/70 bg-card/60 hover:bg-card hover:border-border"
                  }`}
                >
                  <div
                    className={`grid size-11 shrink-0 place-items-center rounded-xl border ${mod.color}`}
                  >
                    {mod.isCustomIcon ? (
                      <CowIcon className="size-6" />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-sm font-bold text-foreground">
                        {mod.title}
                      </p>
                      <span className="rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                        {mod.badge}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {mod.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Future Expansion Modules (Secondary / Coming Soon) */}
        <div className="mt-5 space-y-3 border-t border-border/60 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Secondary & Future Modules
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              <Lock className="size-3" /> Coming Soon
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FUTURE_MODULES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex flex-col items-start rounded-xl border border-dashed border-border/70 bg-muted/20 p-2.5 opacity-80"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <p className="mt-2 text-xs font-bold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                    {item.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
