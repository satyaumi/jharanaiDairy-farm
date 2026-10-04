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
  // Mode selection: "Individual" vs "Average" (matching Reference Image 1 Phone 3)
  const [viewMode, setViewMode] = useState<"individual" | "average">("average");
  const [timeRange, setTimeRange] = useState<"daily" | "monthly">("monthly");
  const [selectedCowId, setSelectedCowId] = useState<string>(
    animals[0]?.id || "a1"
  );

  // Live Metrics Calculations
  const todayTotalMilk = animals.reduce((sum, a) => sum + (a.yield || 0), 0);
  const urgentAlertsCount = alerts.filter((a) => a.level === "Urgent").length;

  const totalStockKg = stockItems.reduce((acc, s) => acc + s.amount, 0);
  const feedStockPercent = stockItems.length > 0
    ? Math.round(
        stockItems.reduce((acc, s) => acc + s.percent, 0) / stockItems.length
      )
    : 85;

  // Monthly Production Dataset (Jan - Sep, matching the reference images)
  const MONTHLY_PRODUCTION = [
    { month: "Jan", production: 380, target: 350, fat: 4.1, snf: 8.8 },
    { month: "Feb", production: 420, target: 360, fat: 4.2, snf: 8.9 },
    { month: "Mar", production: 390, target: 370, fat: 3.9, snf: 8.7 },
    { month: "Apr", production: 460, target: 400, fat: 4.3, snf: 9.1 },
    { month: "May", production: 440, target: 410, fat: 4.0, snf: 8.9 },
    { month: "Jun", production: 480, target: 430, fat: 4.4, snf: 9.2 },
    { month: "Jul", production: 470, target: 430, fat: 4.2, snf: 9.0 },
    { month: "Aug", production: 510, target: 450, fat: 4.5, snf: 9.3 },
    { month: "Sep", production: 495, target: 450, fat: 4.3, snf: 9.1 },
  ];

  // Daily 7-Day Dataset
  const DAILY_PRODUCTION = [
    { day: "Mon", morning: 460, evening: 410, total: 870, fat: 4.1, snf: 8.9 },
    { day: "Tue", morning: 475, evening: 420, total: 895, fat: 4.2, snf: 9.0 },
    { day: "Wed", morning: 465, evening: 415, total: 880, fat: 4.0, snf: 8.8 },
    { day: "Thu", morning: 490, evening: 435, total: 925, fat: 4.3, snf: 9.1 },
    { day: "Fri", morning: 480, evening: 425, total: 905, fat: 4.2, snf: 9.0 },
    { day: "Sat", morning: 505, evening: 445, total: 950, fat: 4.4, snf: 9.2 },
    { day: "Sun", morning: 510, evening: 450, total: 960, fat: 4.3, snf: 9.1 },
  ];

  // Selected cow data if in Individual mode
  const selectedCow = animals.find((a) => a.id === selectedCowId) || animals[0];

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

  // Breeding cycle cows data (matching Phone 3)
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

  return (
    <div className="space-y-4 pb-12 max-w-full overflow-hidden">
      {/* 1. TOP GREEN-TEAL GRADIENT APP BAR (Inspire by Reference Image 1 & 2) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-4 text-white shadow-lg sm:p-6">
        {/* Subtle background circles for organic depth */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-black/10 blur-2xl" />

        {/* Top Header Row with Hamburger & Title */}
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
                Herd Analytics
              </h1>
              <p className="text-[11px] font-semibold text-emerald-100/90 sm:text-xs">
                Jharanai Farm · Production, Quality & Breeding Visualizations
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
              <span className="hidden sm:inline">Export Data</span>
            </Button>
          )}
        </div>

        {/* 2. THE THREE COMPACT KPI CARDS ROW (Exact Match to Reference Images) */}
        <div className="relative grid grid-cols-3 gap-2 sm:gap-3 pt-1">
          {/* Card 1: Milk Production */}
          <div className="flex flex-col items-center rounded-2xl bg-white p-2.5 sm:p-3.5 text-center shadow-md border border-white/60 transition-transform active:scale-[0.98]">
            <div className="grid size-8 sm:size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="size-4.5 sm:size-5 stroke-[2.5]" />
            </div>
            <p className="mt-1.5 text-[9px] sm:text-[11px] font-bold text-slate-500 leading-tight">
              Milk Production:
            </p>
            <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {todayTotalMilk > 0 ? `${todayTotalMilk.toFixed(0)} Ltr` : "2,450 Ltr"}
            </p>
            <span className="text-[8px] sm:text-[10px] font-extrabold text-emerald-600 leading-tight">
              (Today)
            </span>
          </div>

          {/* Card 2: Herd Health */}
          <div className="flex flex-col items-center rounded-2xl bg-white p-2.5 sm:p-3.5 text-center shadow-md border border-white/60 transition-transform active:scale-[0.98]">
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

          {/* Card 3: Feed Stock */}
          <div className="flex flex-col items-center rounded-2xl bg-white p-2.5 sm:p-3.5 text-center shadow-md border border-white/60 transition-transform active:scale-[0.98]">
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

      {/* 3. SEGMENTED CONTROLS & FILTER BAR (Matching Phone 3 in Reference Image 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-2xl bg-card border border-border/80 p-2 shadow-xs">
        {/* Left Segment: Individual vs Average */}
        <div className="flex rounded-xl bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => setViewMode("individual")}
            className={`flex-1 sm:flex-initial rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              viewMode === "individual"
                ? "bg-white text-emerald-800 shadow-xs dark:bg-card dark:text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Individual
          </button>
          <button
            type="button"
            onClick={() => setViewMode("average")}
            className={`flex-1 sm:flex-initial rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              viewMode === "average"
                ? "bg-white text-emerald-800 shadow-xs dark:bg-card dark:text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Average (Herd)
          </button>
        </div>

        {/* Right Segment: Filter / Time Span */}
        <div className="flex items-center gap-2">
          {viewMode === "individual" && animals.length > 0 && (
            <select
              value={selectedCowId}
              onChange={(e) => setSelectedCowId(e.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none"
            >
              {animals.map((cow) => (
                <option key={cow.id} value={cow.id}>
                  {cow.name} ({cow.tag})
                </option>
              ))}
            </select>
          )}

          <div className="flex rounded-xl bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setTimeRange("daily")}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                timeRange === "daily"
                  ? "bg-white text-emerald-800 shadow-xs dark:bg-card dark:text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("monthly")}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                timeRange === "monthly"
                  ? "bg-white text-emerald-800 shadow-xs dark:bg-card dark:text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* 4. COW PRODUCTION CHART (Top Chart in Phone 3) */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs dark:border-border dark:bg-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-foreground">
              {viewMode === "individual"
                ? `${selectedCow?.name || "Cow"} Production (${selectedCow?.tag || "C-1092"})`
                : "Cow Production"}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {viewMode === "individual"
                ? `Breed: ${selectedCow?.breed || "Holstein"} · Current daily: ${selectedCow?.yield || 8.5} L`
                : "Monthly total yield in Litres against farm operational target"}
            </p>
          </div>

          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
            {viewMode === "individual" ? "Per-cow Output" : "Herd Total"}
          </span>
        </div>

        {/* Recharts Bar & Trend Visualization */}
        <div className="h-[210px] sm:h-[260px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={
                viewMode === "individual"
                  ? INDIVIDUAL_COW_PRODUCTION
                  : timeRange === "daily"
                  ? DAILY_PRODUCTION
                  : MONTHLY_PRODUCTION
              }
              margin={{ top: 10, right: 8, left: -22, bottom: 0 }}
            >
              <defs>
                <linearGradient id="barTealGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey={timeRange === "daily" && viewMode === "average" ? "day" : "month"}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11, fontWeight: 600 }}
                dy={4}
              />
              <YAxis
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
                formatter={(val) => [`${val} Litres`, "Production"]}
              />
              <Bar
                dataKey={
                  viewMode === "individual"
                    ? "production"
                    : timeRange === "daily"
                    ? "total"
                    : "production"
                }
                fill="url(#barTealGradient)"
                radius={[6, 6, 0, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. MILK QUALITY SECTION (Fat% and SNF% Dual Charts - Phone 3 middle) */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs dark:border-border dark:bg-card space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-foreground">
              Milk Quality
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Fat% and Solid-Not-Fat (SNF%) laboratory test averages
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-bold text-sky-800 dark:text-sky-300">
            Grade A Certified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Fat % Chart */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground">Fat %</span>
              <span className="text-[10px] font-bold text-emerald-600">
                Avg 4.2% (Target &gt; 4.0%)
              </span>
            </div>
            <div className="h-[140px] sm:h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MONTHLY_PRODUCTION}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  />
                  <YAxis
                    domain={[3, 5]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 9 }}
                  />
                  <Tooltip
                    formatter={(val) => [`${val}%`, "Fat Content"]}
                  />
                  <Bar
                    dataKey="fat"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SNF % Chart */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground">SNF %</span>
              <span className="text-[10px] font-bold text-teal-600">
                Avg 9.0% (Target &gt; 8.5%)
              </span>
            </div>
            <div className="h-[140px] sm:h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={MONTHLY_PRODUCTION}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="snfGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                  />
                  <YAxis
                    domain={[8, 10]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 9 }}
                  />
                  <Tooltip
                    formatter={(val) => [`${val}%`, "SNF Content"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="snf"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fill="url(#snfGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 6. BREEDING CYCLE SECTION (Bottom Section in Phone 3) */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-5 shadow-xs dark:border-border dark:bg-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-foreground">
              Breeding Cycle
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Gestation progression, dry-off schedule, and expected calvings
            </p>
          </div>
          <Calendar className="size-4 text-emerald-600" />
        </div>

        <div className="space-y-3 pt-1">
          {BREEDING_TIMELINE.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 dark:border-border/60 dark:bg-card/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-foreground">
                    {item.cowName} ({item.tag})
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[9px] font-extrabold text-emerald-800 dark:text-emerald-300">
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400">
                  <span className="text-[10px] text-muted-foreground font-semibold">Timeline:</span>
                  <span className="rounded-md bg-teal-600/15 px-1.5 py-0.5 text-[10px] font-black text-teal-800 dark:text-teal-200">
                    {item.date}
                  </span>
                </div>
              </div>

              {/* Gradient Progress Bar (Matching Reference Image 1) */}
              <div className="space-y-1">
                <div className="h-3 w-full rounded-full bg-slate-200/80 dark:bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-700 transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>{item.stage}</span>
                  <span>{item.progress}% Elapsed</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
