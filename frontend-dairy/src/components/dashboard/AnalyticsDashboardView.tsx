import React, { useState } from "react";
import {
  TrendingUp,
  HeartPulse,
  Package,
  Milk,
  Calendar,
  Filter,
  SlidersHorizontal,
  Download,
  AlertTriangle,
  ArrowUpRight,
  Menu,
  ChevronRight,
  ShieldCheck,
  Wheat,
  Activity,
  Award,
  Layers,
  CheckCircle2,
  Tractor,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CowIcon } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
import type { Animal, FarmAlert, MilkRecord, StockItem } from "@/types/farm";

interface AnalyticsDashboardViewProps {
  animals: Animal[];
  alerts: FarmAlert[];
  recentMilk: MilkRecord[];
  stockItems: StockItem[];
  onOpenModulesDrawer?: () => void;
  onOpenQuickRecord?: () => void;
  onSelectAnimal?: (animal: Animal) => void;
  onOpenExport?: () => void;
}

export function AnalyticsDashboardView({
  animals,
  alerts,
  recentMilk,
  stockItems,
  onOpenModulesDrawer,
  onOpenQuickRecord,
  onSelectAnimal,
  onOpenExport,
}: AnalyticsDashboardViewProps) {
  // Modes & Filters
  const [viewMode, setViewMode] = useState<"individual" | "average">("average");
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D");
  const [selectedCowId, setSelectedCowId] = useState<string>(animals[0]?.id || "a1");
  const [activeCurves, setActiveCurves] = useState({
    fat: true,
    protein: true,
    scc: true,
  });

  // Metrics
  const todayTotalMilk = animals.reduce((sum, a) => sum + (a.yield || 0), 0);
  const urgentAlertsCount = alerts.filter((a) => a.level === "Urgent").length;
  const totalStockKg = stockItems.reduce((acc, s) => acc + s.amount, 0);
  const feedStockPercent = stockItems.length > 0
    ? Math.round(stockItems.reduce((acc, s) => acc + s.percent, 0) / stockItems.length)
    : 85;

  // Selected cow
  const selectedCow = animals.find((a) => a.id === selectedCowId) || animals[0];

  // 1. 30-Day Herd Trend (Inspired by reference "Labby" image)
  const HERD_TREND_30D = [
    { period: "1W", fat: 3.9, protein: 3.2, snf: 8.8, scc: 165, yield: 860, target: 850 },
    { period: "2W", fat: 4.1, protein: 3.4, snf: 9.0, scc: 172, yield: 890, target: 860 },
    { period: "3W", fat: 4.2, protein: 3.3, snf: 8.9, scc: 168, yield: 915, target: 870 },
    { period: "4W", fat: 4.3, protein: 3.5, snf: 9.2, scc: 180, yield: 940, target: 880 },
  ];

  // 2. AM vs PM Shift Yield Comparison (7 Days)
  const SHIFT_COMPARISON_7D = [
    { day: "Mon", morning: 470, evening: 410, total: 880 },
    { day: "Tue", morning: 485, evening: 420, total: 905 },
    { day: "Wed", morning: 460, evening: 415, total: 875 },
    { day: "Thu", morning: 495, evening: 435, total: 930 },
    { day: "Fri", morning: 480, evening: 425, total: 905 },
    { day: "Sat", morning: 510, evening: 445, total: 955 },
    { day: "Sun", morning: 505, evening: 440, total: 945 },
  ];

  // 3. Individual Cow Production History
  const INDIVIDUAL_COW_PRODUCTION = [
    { month: "Jan", production: 14.5, target: 14.0 },
    { month: "Feb", production: 16.2, target: 15.0 },
    { month: "Mar", production: 15.8, target: 15.0 },
    { month: "Apr", production: 17.5, target: 16.0 },
    { month: "May", production: 18.0, target: 16.5 },
    { month: "Jun", production: 18.8, target: 17.0 },
    { month: "Jul", production: 19.2, target: 17.0 },
    { month: "Aug", production: 19.5, target: 17.5 },
    { month: "Sep", production: 18.6, target: 17.0 },
  ];

  // 4. Breeding Cycle Timeline
  const BREEDING_TIMELINE = [
    {
      id: "b1",
      cowName: "Willow",
      tag: "C-1041",
      stage: "Late Gestation (Due in 14 days)",
      date: "19 Nov",
      progress: 92,
      status: "Calving Pen Ready",
    },
    {
      id: "b2",
      cowName: "Bluebell",
      tag: "C-0911",
      stage: "Mid Gestation (Dry-off Stage)",
      date: "29 Dec",
      progress: 68,
      status: "Dry Ration Assigned",
    },
    {
      id: "b3",
      cowName: "Rosie",
      tag: "C-0954",
      stage: "Insemination Window (AI Scheduled)",
      date: "12 Jan",
      progress: 35,
      status: "Veterinary Check",
    },
  ];

  // Top producing cows today
  const topCows = [...animals]
    .sort((a, b) => (b.yield || 0) - (a.yield || 0))
    .slice(0, 4);

  return (
    <div className="space-y-4 pb-14 max-w-full overflow-hidden">
      {/* 1. TOP APP BAR (Green-Teal Gradient) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-4 text-white shadow-lg sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-black/10 blur-2xl" />

        <div className="relative flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            {onOpenModulesDrawer && (
              <button
                type="button"
                onClick={onOpenModulesDrawer}
                className="grid size-9 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white/25 active:scale-95"
                aria-label="Farm Menu"
              >
                <Menu className="size-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-black tracking-tight text-white sm:text-2xl">
                Herd & Milk Analytics
              </h1>
              <p className="text-[11px] font-semibold text-emerald-100/90 sm:text-xs">
                Jharanai Farm · Production Trends, Quality Gauges & Gestation Metrics
              </p>
            </div>
          </div>

          {onOpenExport && (
            <Button
              size="sm"
              onClick={onOpenExport}
              className="h-9 gap-1.5 rounded-xl bg-white/20 px-3 text-xs font-bold text-white backdrop-blur-md hover:bg-white/30 active:scale-95"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Export Certified Report</span>
            </Button>
          )}
        </div>

        {/* Top 3 KPI Cards */}
        <div className="relative grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          <div className="flex flex-col items-center rounded-2xl bg-white p-2.5 sm:p-3.5 text-center shadow-md border border-white/60">
            <div className="grid size-8 sm:size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700">
              <TrendingUp className="size-4.5 sm:size-5 stroke-[2.5]" />
            </div>
            <p className="mt-1.5 text-[9px] sm:text-[11px] font-bold text-slate-500 leading-tight">
              Milk Output:
            </p>
            <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {todayTotalMilk > 0 ? `${todayTotalMilk.toFixed(0)} Ltr` : "2,450 Ltr"}
            </p>
            <span className="text-[8px] sm:text-[10px] font-extrabold text-emerald-600 leading-tight">
              +4.8% on target
            </span>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-white p-2.5 sm:p-3.5 text-center shadow-md border border-white/60">
            <div className="relative grid size-8 sm:size-9 place-items-center rounded-xl bg-rose-500/15 text-rose-600">
              <HeartPulse className="size-4.5 sm:size-5 stroke-[2.5]" />
              {urgentAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-rose-600 text-[8px] font-black text-white flex items-center justify-center ring-2 ring-white">
                  !
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[9px] sm:text-[11px] font-bold text-slate-500 leading-tight">
              Herd Health:
            </p>
            <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {animals.length > 0 ? animals.length : 198} Active /
            </p>
            <span className="text-[8px] sm:text-[10px] font-extrabold text-rose-600 leading-tight">
              {urgentAlertsCount} Alerts
            </span>
          </div>

          <div className="flex flex-col items-center rounded-2xl bg-white p-2.5 sm:p-3.5 text-center shadow-md border border-white/60">
            <div className="grid size-8 sm:size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-700">
              <Package className="size-4.5 sm:size-5 stroke-[2.5]" />
            </div>
            <p className="mt-1.5 text-[9px] sm:text-[11px] font-bold text-slate-500 leading-tight">
              Feed Stock:
            </p>
            <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {feedStockPercent}% Full
            </p>
            <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 leading-tight">
              {totalStockKg > 0 ? `${(totalStockKg / 1000).toFixed(1)}t` : "Silo OK"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. LABBY-STYLE QUALITY GAUGES & DISTRIBUTION SECTION (Reference Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Farm Today Average (Circular Radial Gauges) */}
        <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs dark:border-border dark:bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div>
              <h2 className="text-sm font-black text-foreground">Farm Today Quality Average</h2>
              <p className="text-[10px] text-muted-foreground">Certified bulk tank sampling metrics</p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300">
              Grade A Certified
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            {/* Fat Gauge */}
            <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-50/70 dark:bg-muted/30">
              <div className="relative grid size-18 sm:size-20 place-items-center rounded-full border-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30">
                <span className="text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-200">4.2%</span>
              </div>
              <span className="mt-2 text-xs font-black text-foreground">Fat</span>
              <span className="text-[9px] text-muted-foreground font-semibold">Target &gt; 4.0%</span>
            </div>

            {/* Protein / SNF Gauge */}
            <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-50/70 dark:bg-muted/30">
              <div className="relative grid size-18 sm:size-20 place-items-center rounded-full border-4 border-rose-500 bg-rose-50 dark:bg-rose-950/30">
                <span className="text-base sm:text-lg font-black text-rose-800 dark:text-rose-200">3.4%</span>
              </div>
              <span className="mt-2 text-xs font-black text-foreground">Protein</span>
              <span className="text-[9px] text-muted-foreground font-semibold">SNF: 9.0%</span>
            </div>

            {/* SCC Quality Gauge */}
            <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-50/70 dark:bg-muted/30">
              <div className="relative grid size-18 sm:size-20 place-items-center rounded-full border-4 border-purple-500 bg-purple-50 dark:bg-purple-950/30">
                <span className="text-base sm:text-lg font-black text-purple-800 dark:text-purple-200">180k</span>
              </div>
              <span className="mt-2 text-xs font-black text-foreground">SCC/ml</span>
              <span className="text-[9px] text-muted-foreground font-semibold">Low (Clean)</span>
            </div>
          </div>
        </div>

        {/* Herd Level SCC & Health Distribution */}
        <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs dark:border-border dark:bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div>
              <h2 className="text-sm font-black text-foreground">Herd Level Quality Distribution</h2>
              <p className="text-[10px] text-muted-foreground">Somatic cell count herd screening breakdown</p>
            </div>
            <Activity className="size-4 text-teal-600" />
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center pt-3">
            <div className="rounded-2xl border border-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20 p-3">
              <p className="text-xl sm:text-2xl font-black text-purple-700">850</p>
              <p className="text-xs font-bold text-foreground mt-0.5">0 - 150k</p>
              <span className="text-[10px] font-semibold text-emerald-600">Healthy Optimal</span>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 p-3">
              <p className="text-xl sm:text-2xl font-black text-rose-700">20</p>
              <p className="text-xs font-bold text-foreground mt-0.5">150 - 250k</p>
              <span className="text-[10px] font-semibold text-amber-600">Monitor Close</span>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-50/40 dark:bg-cyan-950/20 p-3">
              <p className="text-xl sm:text-2xl font-black text-cyan-700">3</p>
              <p className="text-xs font-bold text-foreground mt-0.5">400k+</p>
              <span className="text-[10px] font-semibold text-rose-600">Recovery Pen</span>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground pt-1">
            97.3% of active dairy cows test below 150k somatic cell count threshold, meeting premium Grade A certification.
          </p>
        </div>
      </div>

      {/* 3. MULTI-CURVE HERD TREND CHART (Labby Style with Pill Toggles) */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs dark:border-border dark:bg-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/50 pb-2">
          <div>
            <h2 className="text-sm sm:text-base font-black text-foreground">
              Jharanai Farm Herd 30-Day Trend
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Composite progression of milk yield volume, fat percentage, and quality
            </p>
          </div>

          {/* Curve Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveCurves((c) => ({ ...c, fat: !c.fat }))}
              className={`rounded-full px-3 py-1 text-[11px] font-black transition-all ${
                activeCurves.fat ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              Fat %
            </button>
            <button
              type="button"
              onClick={() => setActiveCurves((c) => ({ ...c, protein: !c.protein }))}
              className={`rounded-full px-3 py-1 text-[11px] font-black transition-all ${
                activeCurves.protein ? "bg-rose-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              Protein %
            </button>
            <button
              type="button"
              onClick={() => setActiveCurves((c) => ({ ...c, scc: !c.scc }))}
              className={`rounded-full px-3 py-1 text-[11px] font-black transition-all ${
                activeCurves.scc ? "bg-purple-600 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              SCC Index
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[230px] sm:h-[280px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HERD_TREND_30D} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="curveFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="curveProtein" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11, fontWeight: 700 }}
              />
              <YAxis
                domain={[3.0, 4.8]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-popover)",
                  color: "var(--color-popover-foreground)",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              />
              {activeCurves.fat && (
                <Area
                  type="monotone"
                  dataKey="fat"
                  name="Fat %"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#curveFat)"
                />
              )}
              {activeCurves.protein && (
                <Area
                  type="monotone"
                  dataKey="protein"
                  name="Protein %"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fill="url(#curveProtein)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. MORNING VS EVENING SHIFT YIELD COMPARISON (Dairy Dashboard Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Shift Volume Bar Chart */}
        <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs dark:border-border dark:bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div>
              <h2 className="text-sm font-black text-foreground">Morning vs Evening Shift Yields</h2>
              <p className="text-[10px] text-muted-foreground">Litres harvested per milking round</p>
            </div>
            <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-black text-sky-800">
              7-Day Split
            </span>
          </div>

          <div className="h-[200px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SHIFT_COMPARISON_7D} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 9 }}
                />
                <Tooltip />
                <Bar dataKey="morning" name="Morning (AM)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="evening" name="Evening (PM)" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Cost & Target Variance Cards (Dairy Dashboard style) */}
        <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs dark:border-border dark:bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div>
              <h2 className="text-sm font-black text-foreground">Operational Efficiency Targets</h2>
              <p className="text-[10px] text-muted-foreground">Economic & yield variance indicators</p>
            </div>
            <Award className="size-4 text-amber-500" />
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-muted/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Feed Cost / Litre</span>
              <p className="text-lg font-black text-foreground">₹21.40</p>
              <span className="text-[9px] text-emerald-600 font-bold">Target &lt; ₹24.00 (-₹2.60)</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-muted/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Conception Rate</span>
              <p className="text-lg font-black text-foreground">68.2%</p>
              <span className="text-[9px] text-emerald-600 font-bold">Industry benchmark 60%</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-muted/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Vet Cost / Animal</span>
              <p className="text-lg font-black text-foreground">₹160 / mo</p>
              <span className="text-[9px] text-emerald-600 font-bold">Vaccinations up to date</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-muted/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Bulk Tank Chilling</span>
              <p className="text-lg font-black text-teal-700">3.8°C Nominal</p>
              <span className="text-[9px] text-teal-700 font-bold">5,000L Stainless Chiller</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. TOP PRODUCING COWS & BREEDING CYCLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Top Producers */}
        <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs dark:border-border dark:bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div>
              <h2 className="text-sm font-black text-foreground">Top Producing Cows Today</h2>
              <p className="text-[10px] text-muted-foreground">Individual yield champions</p>
            </div>
            <CowIcon className="size-4 text-emerald-600" />
          </div>

          <div className="space-y-2">
            {topCows.map((cow, i) => (
              <div
                key={cow.id}
                onClick={() => onSelectAnimal && onSelectAnimal(cow)}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/70 dark:bg-muted/30 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-800 font-black text-xs">
                    #{i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-foreground truncate">
                      {cow.name} ({cow.tag})
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {cow.breed} · Pen: {cow.pen}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                    {cow.yield ? `${cow.yield} L` : "18.5 L"}
                  </p>
                  <p className="text-[9px] text-muted-foreground">Today's total</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breeding Cycle Progression */}
        <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs dark:border-border dark:bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div>
              <h2 className="text-sm font-black text-foreground">Gestation & Calving Progression</h2>
              <p className="text-[10px] text-muted-foreground">Scheduled timeline and dry-off cycles</p>
            </div>
            <Calendar className="size-4 text-teal-600" />
          </div>

          <div className="space-y-3 pt-1">
            {BREEDING_TIMELINE.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-border/60 dark:bg-card/40 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-foreground">
                    {item.cowName} ({item.tag})
                  </span>
                  <span className="rounded-md bg-teal-600/15 px-1.5 py-0.5 text-[10px] font-black text-teal-800 dark:text-teal-200">
                    Timeline: {item.date}
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-slate-200/80 dark:bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-700"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>{item.stage}</span>
                  <span>{item.progress}% Elapsed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
