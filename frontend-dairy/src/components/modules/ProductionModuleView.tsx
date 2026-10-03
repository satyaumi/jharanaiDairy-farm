import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  Calendar,
  Milk,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { milkWeek } from "@/lib/farm-data";

export function ProductionModuleView() {
  const [range, setRange] = useState<"Day" | "Week" | "Month">("Week");

  const DAY_SERIES = [
    { day: "4 am", liters: 26 },
    { day: "6 am", liters: 184 },
    { day: "8 am", liters: 278 },
    { day: "10 am", liters: 278 },
    { day: "12 pm", liters: 291 },
    { day: "2 pm", liters: 291 },
    { day: "4 pm", liters: 462 },
    { day: "6 pm", liters: 924 },
  ];

  const MONTH_SERIES = [
    { day: "Week 1", liters: 6120 },
    { day: "Week 2", liters: 6240 },
    { day: "Week 3", liters: 6310 },
    { day: "Week 4", liters: 6468 },
  ];

  const chartData =
    range === "Day" ? DAY_SERIES : range === "Month" ? MONTH_SERIES : milkWeek;

  const TOP_COWS = [
    { name: "Luna", tag: "C-1092", yield: 18.8, breed: "Holstein" },
    { name: "Daisy", tag: "C-0982", yield: 17.7, breed: "Brown Swiss" },
    { name: "Maple", tag: "C-1071", yield: 17.6, breed: "Holstein" },
    { name: "Bessie", tag: "C-1024", yield: 16.0, breed: "Holstein" },
  ];

  return (
    <div className="space-y-4">
      {/* Title & Range Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-teal-500/15 text-teal-800 dark:text-teal-300">
              <BarChart3 className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Milk Production Trends
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Daily, weekly & monthly herd output tracking against targets
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex rounded-2xl border border-border/80 bg-background/60 p-1">
          {(["Day", "Week", "Month"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                range === r
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r} View
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Today's Total
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">924 L</p>
          <p className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
            Target 900 L (+24 L)
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            7-Day Output
          </p>
          <p className="mt-1 text-2xl font-extrabold text-teal-700 dark:text-teal-300">
            6,050 L
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            +4.8% from last week
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Daily Average
          </p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">864 L</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Consistent milking
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Top Cow Output
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            18.8 L
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Luna (C-1092)</p>
        </div>
      </div>

      {/* Trend Chart (Mobile-Optimized Height) */}
      <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-foreground">
              Milk Collection Volume ({range})
            </h2>
            <p className="text-xs text-muted-foreground">
              Litres drawn per milking session
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
            {range === "Day" ? "924 L today" : range === "Month" ? "25,138 L month" : "6,050 L week"}
          </span>
        </div>

        <div className="h-[220px] w-full sm:h-[300px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="milkProdGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                dy={6}
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
                formatter={(val) => [`${val} Litres`, "Milk"]}
              />
              <Area
                type="monotone"
                dataKey="liters"
                stroke="#059669"
                strokeWidth={3}
                fill="url(#milkProdGradient)"
                activeDot={{ r: 6, fill: "#059669" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Producers Leaderboard */}
      <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-foreground">
            Top Producing Dairy Cows Today
          </h2>
          <Award className="size-4.5 text-amber-500" />
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {TOP_COWS.map((c, i) => (
            <div
              key={c.tag}
              className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/60 p-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                  #{i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-extrabold text-xs sm:text-sm text-foreground truncate">
                    {c.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {c.tag} · {c.breed}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                  {c.yield} L
                </p>
                <p className="text-[9px] text-muted-foreground">Total day</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
