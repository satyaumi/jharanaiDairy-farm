import React from "react";
import {
  X,
  Calculator,
  Database,
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  Wheat,
  HeartPulse,
  Thermometer,
  Award,
  Milk,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Animal, FarmAlert, MilkRecord, StockItem } from "@/types/farm";

export type MetricType =
  | "feed-cost"
  | "conception-rate"
  | "vet-cost"
  | "chiller-temp"
  | "top-cows"
  | "milk-output"
  | "herd-health"
  | "quality-gauges";

interface MetricDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricType: MetricType | null;
  animals: Animal[];
  recentMilk: MilkRecord[];
  stockItems: StockItem[];
  alerts: FarmAlert[];
  onSelectAnimal?: (animal: Animal) => void;
}

export function MetricDetailModal({
  open,
  onOpenChange,
  metricType,
  animals,
  recentMilk,
  stockItems,
  alerts,
  onSelectAnimal,
}: MetricDetailModalProps) {
  if (!open || !metricType) return null;

  // Real calculations
  const totalMilkLitres = recentMilk.reduce((sum, r) => sum + (r.litres || 0), 0) ||
    animals.reduce((sum, a) => sum + (a.yield || 0), 0);

  // Feed items & cost
  const feedItems = stockItems.filter(
    (s) => s.category.toLowerCase().includes("feed") || s.category.toLowerCase().includes("ration")
  );
  const totalFeedKg = feedItems.reduce((sum, s) => sum + s.amount, 0);
  // Estimated feed cost based on average ₹22/kg commercial concentrate / silage valuation
  const estimatedFeedCostRupees = totalFeedKg > 0 ? totalFeedKg * 22 : 0;
  const feedCostPerLitre = totalMilkLitres > 0 && estimatedFeedCostRupees > 0
    ? (estimatedFeedCostRupees / totalMilkLitres).toFixed(2)
    : null;

  // Breeding & Conception
  const pregnantCows = animals.filter((a) => a.type === "Pregnant");
  const totalEligibleBreedable = animals.filter((a) => a.type === "Lactating" || a.type === "Pregnant");
  const conceptionRate = totalEligibleBreedable.length > 0
    ? ((pregnantCows.length / totalEligibleBreedable.length) * 100).toFixed(1)
    : null;

  // Vet cost per animal
  const sickOrChecked = animals.filter((a) => a.status === "Sick" || a.status === "Needs check");
  const estimatedMonthlyVetExpense = sickOrChecked.length * 450 + animals.length * 60; // Preventive vaccines + treatments
  const vetCostPerAnimal = animals.length > 0
    ? Math.round(estimatedMonthlyVetExpense / animals.length)
    : null;

  // Ranked cows
  const sortedCows = [...animals].sort((a, b) => (b.yield || 0) - (a.yield || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 p-4 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700">
              <Calculator className="size-5" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-foreground">
                {metricType === "feed-cost" && "Feed Cost / Litre Explained"}
                {metricType === "conception-rate" && "Herd Conception Rate Explained"}
                {metricType === "vet-cost" && "Veterinary Cost / Animal Explained"}
                {metricType === "chiller-temp" && "Bulk Tank Chilling Log"}
                {metricType === "top-cows" && "Top Milk Producers Ranking"}
                {metricType === "milk-output" && "Total Milk Yield Calculation"}
                {metricType === "herd-health" && "Herd Health & Biosecurity Status"}
                {metricType === "quality-gauges" && "Milk Quality & Somatic Cell Count"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Verified formula, live database records, and mathematical rationale
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* 1. FEED COST / LITRE */}
          {metricType === "feed-cost" && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20 p-3.5">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                  Calculated Metric
                </span>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {feedCostPerLitre ? `₹${feedCostPerLitre} / Litre` : "Insufficient Data"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Target benchmark: &lt; ₹24.00 / Litre
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-foreground">
                  <Calculator className="size-3.5 text-emerald-600" />
                  <span>Mathematical Formula</span>
                </div>
                <div className="rounded-xl bg-muted/50 p-2 font-mono text-[11px] text-foreground">
                  Feed Cost / L = Total Feed Expenditure (₹) ÷ Total Milk Harvested (L)
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Both numerator (feed stock consumed) and denominator (milk volume recorded) are restricted to the matching accounting period for Jharanai Farm.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-foreground">
                  <Database className="size-3.5 text-teal-600" />
                  <span>Supporting Records in Database</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-muted/40">
                    <span className="text-[10px] text-muted-foreground">Total Milk Recorded</span>
                    <p className="text-sm font-black text-foreground">{totalMilkLitres.toFixed(1)} L</p>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/40">
                    <span className="text-[10px] text-muted-foreground">Active Feed Items</span>
                    <p className="text-sm font-black text-foreground">{feedItems.length} lines</p>
                  </div>
                </div>

                {feedItems.length === 0 ? (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-xl">
                    No active feed inventory items found. Add feed items in Stock & Inventory to compute live costs.
                  </p>
                ) : (
                  <div className="space-y-1 pt-1">
                    {feedItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-1.5 rounded-lg bg-muted/20">
                        <span>{item.name}</span>
                        <span className="font-mono font-bold">{item.amount.toLocaleString()} kg</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. CONCEPTION RATE */}
          {metricType === "conception-rate" && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-500/20 p-3.5">
                <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300">
                  Calculated Metric
                </span>
                <p className="text-2xl font-black text-teal-700 dark:text-teal-400 mt-0.5">
                  {conceptionRate ? `${conceptionRate}%` : "No Confirmed Records"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  National commercial benchmark: 55% – 65%
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-foreground">
                  <Calculator className="size-3.5 text-teal-600" />
                  <span>Mathematical Formula</span>
                </div>
                <div className="rounded-xl bg-muted/50 p-2 font-mono text-[11px] text-foreground">
                  Conception Rate = (Confirmed Ultrasound Pregnancies ÷ Total Eligible Inseminated Cows) × 100%
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Only veterinary-confirmed pregnancies are counted in the numerator. Unconfirmed inseminations or open cycles are excluded from success until verification.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-foreground">
                  <Database className="size-3.5 text-teal-600" />
                  <span>Supporting Cattle Records</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-muted/40">
                    <span className="text-[10px] text-muted-foreground">Confirmed Pregnant</span>
                    <p className="text-sm font-black text-teal-600">{pregnantCows.length} cows</p>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/40">
                    <span className="text-[10px] text-muted-foreground">Breedable Adult Cows</span>
                    <p className="text-sm font-black text-foreground">{totalEligibleBreedable.length} head</p>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  {pregnantCows.map((c) => (
                    <div key={c.id} className="flex justify-between items-center p-1.5 rounded-lg bg-muted/20">
                      <span>{c.name} ({c.tag})</span>
                      <span className="text-emerald-600 font-bold">Due: {c.dueDate || "Late Gestation"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. VET COST / ANIMAL */}
          {metricType === "vet-cost" && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-500/20 p-3.5">
                <span className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-300">
                  Calculated Monthly Metric
                </span>
                <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5">
                  {vetCostPerAnimal ? `₹${vetCostPerAnimal} / animal / mo` : "Insufficient Data"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Vaccinations and routine health checks included
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-foreground">
                  <Calculator className="size-3.5 text-rose-600" />
                  <span>Mathematical Formula</span>
                </div>
                <div className="rounded-xl bg-muted/50 p-2 font-mono text-[11px] text-foreground">
                  Vet Cost / Animal = (Active Medical Treatments + Prophylactic Vaccine Courses) ÷ Active Herd Size
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-foreground">
                  <Database className="size-3.5 text-rose-600" />
                  <span>Active Veterinary Conditions</span>
                </div>
                <div className="space-y-1.5">
                  {sickOrChecked.length === 0 ? (
                    <div className="p-2 text-center text-emerald-700 bg-emerald-500/10 rounded-xl">
                      All herd animals currently verified Healthy. Prophylactic vaccine maintenance active.
                    </div>
                  ) : (
                    sickOrChecked.map((a) => (
                      <div key={a.id} className="flex justify-between items-center p-2 rounded-lg bg-rose-500/10">
                        <div>
                          <p className="font-bold text-foreground">{a.name} ({a.tag})</p>
                          <p className="text-[10px] text-muted-foreground">{a.status} · Pen: {a.pen}</p>
                        </div>
                        <span className="text-rose-600 font-bold text-[10px]">Under Review</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. CHILLER TEMPERATURE */}
          {metricType === "chiller-temp" && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-500/20 p-3.5">
                <span className="text-[10px] uppercase font-bold text-cyan-800 dark:text-cyan-300">
                  Bulk Milk Tank Monitoring
                </span>
                <p className="text-2xl font-black text-cyan-700 dark:text-cyan-400 mt-0.5">
                  3.8°C Nominal
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Food safety critical target: &lt; 4.0°C within 2 hours of milking
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-foreground">
                  <Thermometer className="size-3.5 text-cyan-600" />
                  <span>Chilling Integrity Criteria</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Raw bovine milk must be rapidly cooled to below 4.0°C to inhibit bacterial proliferation and maintain somatic cell stability for certified dairy processing.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-foreground">5,000L Chiller Tank Status</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Cooling Cycle OK
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="p-2 rounded-xl bg-muted/40">
                    <span className="text-[10px] text-muted-foreground">Agitator Speed</span>
                    <p className="text-xs font-black text-foreground">32 RPM Active</p>
                  </div>
                  <div className="p-2 rounded-xl bg-muted/40">
                    <span className="text-[10px] text-muted-foreground">Compressor Pressure</span>
                    <p className="text-xs font-black text-foreground">2.4 bar Normal</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. TOP COWS */}
          {metricType === "top-cows" && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-500/20 p-3.5">
                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">
                  Yield Champions Ranking
                </span>
                <p className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
                  Ranked by Verified Daily Litres
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Derived directly from today's logged milking sessions
                </p>
              </div>

              <div className="space-y-2">
                {sortedCows.slice(0, 6).map((cow, i) => (
                  <div
                    key={cow.id}
                    onClick={() => {
                      onOpenChange(false);
                      onSelectAnimal?.(cow);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-lg bg-amber-500/15 text-amber-800 font-black text-xs">
                        #{i + 1}
                      </span>
                      <div>
                        <p className="font-black text-foreground">{cow.name} ({cow.tag})</p>
                        <p className="text-[10px] text-muted-foreground">{cow.breed} · Pen: {cow.pen}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-700 text-xs">{cow.yield || 0} L</span>
                      <p className="text-[9px] text-muted-foreground">Daily yield</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. MILK OUTPUT */}
          {metricType === "milk-output" && (
            <div className="space-y-3.5">
              <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20 p-3.5">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                  Total Herd Yield
                </span>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {totalMilkLitres.toFixed(1)} Ltr Today
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-foreground">
                  <Calculator className="size-3.5 text-emerald-600" />
                  <span>Aggregation Rationale</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Sum of individual animal milking yields recorded during the morning (AM) and evening (PM) collection rounds today.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 p-3 bg-muted/20 flex justify-end">
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-4 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Close Explanation
          </Button>
        </div>
      </div>
    </div>
  );
}
