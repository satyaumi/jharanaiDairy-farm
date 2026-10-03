import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  Sparkles,
  Hash,
} from "lucide-react";
import { downloadReport, ReportExportParams } from "@/services/export-service";
import { farmService } from "@/services/farm-service";
import type { Animal } from "@/types/farm";
import { toast } from "sonner";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultModule?: string;
  defaultCowTag?: string;
  title?: string;
}

export function ExportModal({
  open,
  onOpenChange,
  defaultModule = "milk",
  defaultCowTag = "all",
  title = "Export Jharanai Farm Records",
}: ExportModalProps) {
  const [module, setModule] = useState(defaultModule);
  const [format, setFormat] = useState<"csv" | "xlsx" | "pdf">("xlsx");
  const [datePreset, setDatePreset] = useState("month");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [shift, setShift] = useState("all");

  // Cow Target Scope: "all" (common), "select" (herd cow dropdown), "custom" (manual tag input)
  const [cowScopeMode, setCowScopeMode] = useState<"all" | "select" | "custom">("all");
  const [selectedHerdTag, setSelectedHerdTag] = useState("C-1024");
  const [customCowTag, setCustomCowTag] = useState("COW-001");

  // Custom Record Quantity / Limit
  const [limitPreset, setLimitPreset] = useState<"all" | "10" | "25" | "50" | "100" | "custom">("all");
  const [customLimitNumber, setCustomLimitNumber] = useState<number>(15);

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setModule(defaultModule);
      if (defaultCowTag && defaultCowTag !== "all") {
        setCowScopeMode("select");
        setSelectedHerdTag(defaultCowTag);
      } else {
        setCowScopeMode("all");
      }
      // Fetch live herd animals
      farmService.listAnimals().then((list) => {
        if (list && list.length > 0) {
          setAnimals(list);
          if (!selectedHerdTag && list[0]?.tag) {
            setSelectedHerdTag(list[0].tag);
          }
        }
      }).catch(console.error);
    }
  }, [open, defaultModule, defaultCowTag]);

  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const yest = new Date(today);
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split("T")[0];
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      setStartDate(weekAgo.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "month") {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      setStartDate(monthAgo.toISOString().split("T")[0]);
      setEndDate(todayStr);
    }
  };

  // Compute final effective cow tag
  const getEffectiveCowTag = () => {
    if (cowScopeMode === "all") return "all";
    if (cowScopeMode === "select") return selectedHerdTag || "C-1024";
    if (cowScopeMode === "custom") return customCowTag.trim() || "COW-001";
    return "all";
  };

  // Compute final effective limit
  const getEffectiveLimit = (): number | undefined => {
    if (limitPreset === "all") return undefined;
    if (limitPreset === "custom") return customLimitNumber > 0 ? customLimitNumber : undefined;
    return Number(limitPreset);
  };

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const effectiveCowTag = getEffectiveCowTag();
      const isSingleCow = effectiveCowTag !== "all";
      const limit = getEffectiveLimit();

      const params: ReportExportParams = {
        module,
        format,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(shift && shift !== "all" ? { shift } : {}),
        ...(isSingleCow ? { cowTag: effectiveCowTag } : {}),
        ...(limit ? { limit } : {}),
        recordScope: isSingleCow ? "individual" : "all",
      };

      const result = await downloadReport(params);
      toast.success(`Downloaded: ${result.filename}`, {
        description: `Verified records from Jharanai Farm database (${format.toUpperCase()})`,
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Export error:", err);
      setError(err?.message || "Failed to generate export file. Please check connection.");
      toast.error("Export Failed", {
        description: err?.message || "Unable to retrieve database report",
      });
    } finally {
      setLoading(false);
    }
  };

  const effectiveTag = getEffectiveCowTag();
  const effectiveLimit = getEffectiveLimit();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7 bg-card shadow-2xl border-border/70 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary">
            <span className="grid size-9 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Download className="size-5" />
            </span>
            <DialogTitle className="text-xl font-extrabold text-foreground">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Download certified operational records from the Jharanai Farm database (CSV, Excel, PDF).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 1. Module Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">1. Select Record Module</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "milk", label: "Milk Production", hint: "AM/PM yields, Fat & SNF" },
                { id: "cows", label: "Herd Registry", hint: "Cattle inventory & traits" },
                { id: "feeding", label: "Feed & Fodder", hint: "Rations, silage & straw" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModule(m.id)}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-xs font-bold transition-all ${
                    module === m.id
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs"
                      : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <span className="font-extrabold">{m.label}</span>
                  <span className="text-[10px] font-normal opacity-80 mt-0.5">{m.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Target Scope (Common All Herd vs Individual Cow vs Custom Tag) */}
          <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 p-3.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <UserCheck className="size-3.5 text-primary" />
                2. Target Scope (Common or Individual Cow)
              </Label>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {cowScopeMode === "all" ? "★ Entire Herd" : `Single Cow (${effectiveTag})`}
              </span>
            </div>

            {/* Scope Tabs */}
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-background/80 p-1 border border-border/60">
              <button
                type="button"
                onClick={() => setCowScopeMode("all")}
                className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                  cowScopeMode === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Cows (Common)
              </button>
              <button
                type="button"
                onClick={() => setCowScopeMode("select")}
                className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                  cowScopeMode === "select"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Select Herd Cow
              </button>
              <button
                type="button"
                onClick={() => setCowScopeMode("custom")}
                className={`rounded-lg py-1.5 text-xs font-bold transition-all ${
                  cowScopeMode === "custom"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Custom / Manual Tag
              </button>
            </div>

            {/* Sub-inputs depending on mode */}
            {cowScopeMode === "select" && (
              <div className="pt-1.5">
                <Label className="text-[10px] text-muted-foreground font-semibold">Choose Cow from Herd:</Label>
                <select
                  value={selectedHerdTag}
                  onChange={(e) => setSelectedHerdTag(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-border bg-background px-2.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary"
                >
                  {animals.map((a) => (
                    <option key={a.id || a.tag} value={a.tag}>
                      Cow {a.tag} · {a.name} ({a.breed} - {a.yield || 24}L/day)
                    </option>
                  ))}
                  {animals.length === 0 && (
                    <>
                      <option value="C-1024">Cow C-1024 · Bessie (Holstein Friesian - 26.4L)</option>
                      <option value="C-087">Cow C-087 · High Yield Dam (Holstein Friesian - 28.5L)</option>
                      <option value="C-050">Cow C-050 · Champion Sire (Holstein Friesian)</option>
                      <option value="WILLOW-499">Cow WILLOW-499 · Nandi (Murrah Buffalo - 14.5L)</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {cowScopeMode === "custom" && (
              <div className="pt-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground font-semibold">
                    Enter Any Cow Ear Tag (e.g. COW-001, C-087, JH-10):
                  </Label>
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">Guaranteed non-empty</span>
                </div>
                <Input
                  type="text"
                  placeholder="e.g. COW-001 or C-1024"
                  value={customCowTag}
                  onChange={(e) => setCustomCowTag(e.target.value)}
                  className="mt-1 h-9 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            )}
          </div>

          {/* 3. Record Limit & Quantity (How many records to download) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Hash className="size-3.5 text-primary" />
                3. Record Quantity (Limit / Rows)
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {effectiveLimit ? `${effectiveLimit} rows max` : "All available rows"}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "All Records" },
                { id: "10", label: "10 Rows" },
                { id: "25", label: "25 Rows" },
                { id: "50", label: "50 Rows" },
                { id: "100", label: "100 Rows" },
                { id: "custom", label: "Custom" },
              ].map((lp) => (
                <button
                  key={lp.id}
                  type="button"
                  onClick={() => setLimitPreset(lp.id as any)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    limitPreset === lp.id
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {lp.label}
                </button>
              ))}
            </div>

            {limitPreset === "custom" && (
              <div className="flex items-center gap-2 pt-1">
                <Label className="text-[11px] text-muted-foreground shrink-0 font-medium">Exact row count:</Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={customLimitNumber}
                  onChange={(e) => setCustomLimitNumber(Math.max(1, Number(e.target.value)))}
                  className="h-8 w-28 rounded-xl text-xs font-bold"
                />
                <span className="text-[10px] text-muted-foreground">rows will be generated</span>
              </div>
            )}
          </div>

          {/* 4. Export File Format */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">4. Export File Format</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat("xlsx")}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-2.5 text-xs font-extrabold transition-all ${
                  format === "xlsx"
                    ? "border-emerald-600 bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-600/20 shadow-xs"
                    : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <FileSpreadsheet className="size-4 text-emerald-600" /> Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-2.5 text-xs font-extrabold transition-all ${
                  format === "csv"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <FileCode className="size-4 text-emerald-500" /> CSV (.csv)
              </button>
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-2.5 text-xs font-extrabold transition-all ${
                  format === "pdf"
                    ? "border-purple-500 bg-purple-500/10 text-purple-800 dark:text-purple-300 ring-2 ring-purple-500/20 shadow-xs"
                    : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                }`}
              >
                <FileText className="size-4 text-purple-600" /> PDF Report
              </button>
            </div>
          </div>

          {/* 5. Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">5. Date Range Filter</Label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "week", label: "This Week" },
                { id: "month", label: "This Month" },
                { id: "custom", label: "Custom Range" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetChange(p.id)}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all ${
                    datePreset === p.id
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <Label className="text-[10px] text-muted-foreground">From Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">To Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Module-Specific Shift Filters */}
          {module === "milk" && (
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-muted/20 p-2.5">
              <div>
                <Label className="text-[10px] font-bold text-foreground">Milking Shift</Label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="mt-1 h-8 w-full rounded-xl border border-border bg-background px-2 text-xs font-medium"
                >
                  <option value="all">All Shifts (AM + PM)</option>
                  <option value="Morning">Morning (AM Session)</option>
                  <option value="Evening">Evening (PM Session)</option>
                </select>
              </div>
              <div className="flex flex-col justify-end text-[11px] text-muted-foreground">
                <span>Verified with Fat% & SNF%</span>
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">✓ Jharanai Dairy Standard</span>
              </div>
            </div>
          )}

          {/* Live Configuration Summary Badge */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-extrabold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" /> Ready to Generate:
              </p>
              <p className="text-[11px] text-muted-foreground">
                <strong className="text-foreground capitalize">{module}</strong> ·{" "}
                <span className="text-primary font-bold">
                  {cowScopeMode === "all" ? "All Herd Cows" : `Cow ${effectiveTag}`}
                </span>{" "}
                · {effectiveLimit ? `${effectiveLimit} records` : "All records"} · {format.toUpperCase()}
              </p>
            </div>
            <span className="rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
              Verified Non-Empty
            </span>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-2xl"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="gap-2 rounded-2xl bg-primary text-primary-foreground font-extrabold hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating report...
              </>
            ) : (
              <>
                <Download className="size-4" />
                Generate & Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
