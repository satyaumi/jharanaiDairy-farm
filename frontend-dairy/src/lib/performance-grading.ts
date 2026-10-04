import type { Animal, MilkRecord } from "@/types/farm";

export type PerformanceGrade =
  | "Excellent"
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "Insufficient Data";

export interface PerformanceThresholds {
  excellentMin: number; // e.g. 20.0 L
  aMin: number;         // e.g. 16.0 L
  bMin: number;         // e.g. 13.0 L
  cMin: number;         // e.g. 10.0 L
  dMin: number;         // e.g. 7.0 L
  eMin: number;         // e.g. 4.0 L
}

export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  excellentMin: 20.0,
  aMin: 16.0,
  bMin: 13.0,
  cMin: 10.0,
  dMin: 7.0,
  eMin: 4.0,
};

const STORAGE_KEY_THRESHOLDS = "jharanai_grading_thresholds";

export function getStoredThresholds(): PerformanceThresholds {
  if (typeof window === "undefined") return DEFAULT_THRESHOLDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_THRESHOLDS);
    if (!raw) return DEFAULT_THRESHOLDS;
    const parsed = JSON.parse(raw) as Partial<PerformanceThresholds>;
    return {
      excellentMin: Number(parsed.excellentMin ?? DEFAULT_THRESHOLDS.excellentMin),
      aMin: Number(parsed.aMin ?? DEFAULT_THRESHOLDS.aMin),
      bMin: Number(parsed.bMin ?? DEFAULT_THRESHOLDS.bMin),
      cMin: Number(parsed.cMin ?? DEFAULT_THRESHOLDS.cMin),
      dMin: Number(parsed.dMin ?? DEFAULT_THRESHOLDS.dMin),
      eMin: Number(parsed.eMin ?? DEFAULT_THRESHOLDS.eMin),
    };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

export function saveStoredThresholds(thresholds: PerformanceThresholds): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_THRESHOLDS, JSON.stringify(thresholds));
  } catch (err) {
    console.error("Failed to persist grading thresholds:", err);
  }
}

export interface CowPerformanceEvaluation {
  grade: PerformanceGrade;
  dailyYield: number;
  totalPeriodYield: number;
  validRecordCount: number;
  explanation: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  trend: "rising" | "steady" | "declining" | "none";
  lastMilkingTimestamp?: string;
}

export function evaluateCowGrade(
  animal: Animal,
  milkRecords: MilkRecord[],
  thresholds: PerformanceThresholds = getStoredThresholds()
): CowPerformanceEvaluation {
  // Find all valid milk records matching this animal ID or Tag
  const animalRecords = milkRecords.filter(
    (r) => r.animalId === animal.id || r.tag === animal.tag
  );

  const validRecordCount = animalRecords.length;
  const totalPeriodYield = animalRecords.reduce((sum, r) => sum + (r.litres || 0), 0);

  // If we have actual milking records, use sum of today's records or average
  let dailyYield = 0;
  if (validRecordCount > 0) {
    dailyYield = Number(totalPeriodYield.toFixed(1));
  } else if (animal.yield && animal.yield > 0) {
    dailyYield = Number(animal.yield.toFixed(1));
  }

  const lastRecord = animalRecords[0];
  const lastMilkingTimestamp = lastRecord
    ? `${lastRecord.session} round (${lastRecord.recordedAt})`
    : animal.lastMilkingDate || undefined;

  // Non-lactating cows (Calves, Dry cows, or cows with 0 yield & 0 records)
  if (animal.type === "Calf" || animal.type === "Dry" || (dailyYield === 0 && validRecordCount === 0)) {
    return {
      grade: "Insufficient Data",
      dailyYield: 0,
      totalPeriodYield: 0,
      validRecordCount,
      explanation:
        animal.type === "Calf"
          ? "Young stock calf — not in active milking cycle."
          : animal.type === "Dry"
          ? "Dry cow resting phase — lactation currently suspended."
          : "No recorded milking sessions logged for this animal.",
      badgeBg: "bg-slate-100 dark:bg-slate-800",
      badgeText: "text-slate-600 dark:text-slate-300",
      badgeBorder: "border-slate-300 dark:border-slate-700",
      trend: "none",
      lastMilkingTimestamp,
    };
  }

  // Grade classification based on configured thresholds
  if (dailyYield >= thresholds.excellentMin) {
    return {
      grade: "Excellent",
      dailyYield,
      totalPeriodYield,
      validRecordCount,
      explanation: `Top-tier yield of ${dailyYield.toFixed(1)} L/day surpasses the Excellent threshold (≥ ${thresholds.excellentMin.toFixed(1)} L/day).`,
      badgeBg: "bg-emerald-500/15 dark:bg-emerald-500/25",
      badgeText: "text-emerald-700 dark:text-emerald-300 font-black",
      badgeBorder: "border-emerald-500/30",
      trend: "rising",
      lastMilkingTimestamp,
    };
  }

  if (dailyYield >= thresholds.aMin) {
    return {
      grade: "A",
      dailyYield,
      totalPeriodYield,
      validRecordCount,
      explanation: `Strong commercial yield of ${dailyYield.toFixed(1)} L/day meets Grade A standard (${thresholds.aMin.toFixed(1)} – ${(thresholds.excellentMin - 0.1).toFixed(1)} L/day).`,
      badgeBg: "bg-teal-500/15 dark:bg-teal-500/25",
      badgeText: "text-teal-700 dark:text-teal-300 font-black",
      badgeBorder: "border-teal-500/30",
      trend: "steady",
      lastMilkingTimestamp,
    };
  }

  if (dailyYield >= thresholds.bMin) {
    return {
      grade: "B",
      dailyYield,
      totalPeriodYield,
      validRecordCount,
      explanation: `Consistent yield of ${dailyYield.toFixed(1)} L/day meets Grade B standard (${thresholds.bMin.toFixed(1)} – ${(thresholds.aMin - 0.1).toFixed(1)} L/day).`,
      badgeBg: "bg-sky-500/15 dark:bg-sky-500/25",
      badgeText: "text-sky-700 dark:text-sky-300 font-black",
      badgeBorder: "border-sky-500/30",
      trend: "steady",
      lastMilkingTimestamp,
    };
  }

  if (dailyYield >= thresholds.cMin) {
    return {
      grade: "C",
      dailyYield,
      totalPeriodYield,
      validRecordCount,
      explanation: `Moderate yield of ${dailyYield.toFixed(1)} L/day meets Grade C standard (${thresholds.cMin.toFixed(1)} – ${(thresholds.bMin - 0.1).toFixed(1)} L/day).`,
      badgeBg: "bg-amber-500/15 dark:bg-amber-500/25",
      badgeText: "text-amber-700 dark:text-amber-300 font-black",
      badgeBorder: "border-amber-500/30",
      trend: "steady",
      lastMilkingTimestamp,
    };
  }

  if (dailyYield >= thresholds.dMin) {
    return {
      grade: "D",
      dailyYield,
      totalPeriodYield,
      validRecordCount,
      explanation: `Below-average yield of ${dailyYield.toFixed(1)} L/day is in Grade D range (${thresholds.dMin.toFixed(1)} – ${(thresholds.cMin - 0.1).toFixed(1)} L/day). Review feed ration.`,
      badgeBg: "bg-orange-500/15 dark:bg-orange-500/25",
      badgeText: "text-orange-700 dark:text-orange-300 font-black",
      badgeBorder: "border-orange-500/30",
      trend: "declining",
      lastMilkingTimestamp,
    };
  }

  if (dailyYield >= thresholds.eMin) {
    return {
      grade: "E",
      dailyYield,
      totalPeriodYield,
      validRecordCount,
      explanation: `Low production of ${dailyYield.toFixed(1)} L/day is in Grade E range (${thresholds.eMin.toFixed(1)} – ${(thresholds.dMin - 0.1).toFixed(1)} L/day). Check for mastitis or health stress.`,
      badgeBg: "bg-rose-500/15 dark:bg-rose-500/25",
      badgeText: "text-rose-700 dark:text-rose-300 font-black",
      badgeBorder: "border-rose-500/30",
      trend: "declining",
      lastMilkingTimestamp,
    };
  }

  return {
    grade: "F",
    dailyYield,
    totalPeriodYield,
    validRecordCount,
    explanation: `Critical low yield of ${dailyYield.toFixed(1)} L/day is in Grade F range (< ${thresholds.eMin.toFixed(1)} L/day). Immediate veterinary & lactation evaluation advised.`,
    badgeBg: "bg-red-500/20 dark:bg-red-500/30",
    badgeText: "text-red-700 dark:text-red-300 font-black",
    badgeBorder: "border-red-500/40",
    trend: "declining",
    lastMilkingTimestamp,
  };
}

export interface GroupSummaryCounts {
  eligibleCount: number;
  excellentCount: number;
  aCount: number;
  bCount: number;
  cCount: number;
  dCount: number;
  eCount: number;
  fCount: number;
  insufficientCount: number;
  totalHerd: number;
}

export function computeGroupSummary(
  animals: Animal[],
  milkRecords: MilkRecord[],
  thresholds: PerformanceThresholds = getStoredThresholds()
): GroupSummaryCounts {
  let eligibleCount = 0;
  let excellentCount = 0;
  let aCount = 0;
  let bCount = 0;
  let cCount = 0;
  let dCount = 0;
  let eCount = 0;
  let fCount = 0;
  let insufficientCount = 0;

  for (const animal of animals) {
    const evalResult = evaluateCowGrade(animal, milkRecords, thresholds);
    if (evalResult.grade === "Insufficient Data") {
      insufficientCount++;
    } else {
      eligibleCount++;
      switch (evalResult.grade) {
        case "Excellent":
          excellentCount++;
          break;
        case "A":
          aCount++;
          break;
        case "B":
          bCount++;
          break;
        case "C":
          cCount++;
          break;
        case "D":
          dCount++;
          break;
        case "E":
          eCount++;
          break;
        case "F":
          fCount++;
          break;
      }
    }
  }

  return {
    eligibleCount,
    excellentCount,
    aCount,
    bCount,
    cCount,
    dCount,
    eCount,
    fCount,
    insufficientCount,
    totalHerd: animals.length,
  };
}
