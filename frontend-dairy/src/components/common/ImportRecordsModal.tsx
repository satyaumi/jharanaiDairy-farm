import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Download,
  AlertCircle,
  FileText,
  Loader2,
  ChevronRight,
  SlidersHorizontal,
  History,
} from "lucide-react";
import {
  importService,
  ImportAnalyzeResult,
  ImportConfirmResult,
} from "@/services/import-service";
import { toast } from "sonner";

interface ImportRecordsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

type ImportStep = "UPLOAD" | "MAPPING" | "PREVIEW" | "CONFIRM" | "RESULT";

export function ImportRecordsModal({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportRecordsModalProps) {
  const [step, setStep] = useState<ImportStep>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ImportAnalyzeResult | null>(null);
  const [customMappings, setCustomMappings] = useState<Record<string, string>>({});
  const [importOnlyValid, setImportOnlyValid] = useState(true);
  const [confirmResult, setConfirmResult] = useState<ImportConfirmResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("UPLOAD");
    setFile(null);
    setAnalysisResult(null);
    setCustomMappings({});
    setConfirmResult(null);
    setErrorMsg(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      await startAnalysis(selected);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      await startAnalysis(dropped);
    }
  };

  const startAnalysis = async (targetFile: File) => {
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const result = await importService.analyzeFile(targetFile);
      setAnalysisResult(result);
      setCustomMappings(result.detectedMappings || {});
      setStep("MAPPING");
    } catch (err: any) {
      console.error("Analysis error:", err);
      setErrorMsg(err?.message || "Failed to analyze file format");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleProceedToPreview = () => {
    setStep("PREVIEW");
  };

  const handleExecuteImport = async () => {
    if (!analysisResult) return;
    setConfirming(true);
    setErrorMsg(null);

    try {
      // Build row data based on confirmed mappings
      const rawRowsToSubmit = analysisResult.previewRows
        .filter((row) => (!importOnlyValid ? true : row.status !== "ERROR"))
        .map((row) => {
          const stringRow: Record<string, string> = {};
          for (const [k, v] of Object.entries(row.data)) {
            stringRow[k] = v != null ? String(v) : "";
          }
          return stringRow;
        });

      if (rawRowsToSubmit.length === 0) {
        throw new Error("No valid records selected to import.");
      }

      const res = await importService.confirmImport({
        recordType: analysisResult.recordType,
        fileName: analysisResult.fileName,
        importOnlyValid,
        mappings: customMappings,
        rows: rawRowsToSubmit,
      });

      setConfirmResult(res);
      setStep("RESULT");
      toast.success(res.message, {
        description: `Batch: ${res.batchCode} · Jharanai Farm database synchronized`,
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
      });

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      console.error("Confirm error:", err);
      setErrorMsg(err?.message || "Failed to commit import records");
      toast.error("Import Failed", {
        description: err?.message || "Database update failed",
      });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-2xl rounded-2xl p-6 sm:p-7 bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <FileSpreadsheet className="size-5" />
              </span>
              <div>
                <DialogTitle className="text-xl font-extrabold text-foreground">
                  Import & Synchronize Records
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Jharanai Farm · Smart schema mapping, validation & upsert
                </DialogDescription>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <span className={step === "UPLOAD" ? "text-primary font-black" : ""}>1. Upload</span>
              <ChevronRight className="size-3" />
              <span className={step === "MAPPING" ? "text-primary font-black" : ""}>2. Map</span>
              <ChevronRight className="size-3" />
              <span className={step === "PREVIEW" ? "text-primary font-black" : ""}>3. Preview</span>
              <ChevronRight className="size-3" />
              <span className={step === "RESULT" ? "text-primary font-black" : ""}>4. Done</span>
            </div>
          </div>
        </DialogHeader>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === "UPLOAD" && (
          <div className="space-y-4 py-3">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                {analyzing ? (
                  <Loader2 className="size-7 animate-spin" />
                ) : (
                  <UploadCloud className="size-7" />
                )}
              </div>
              <div>
                <p className="text-sm font-extrabold text-foreground">
                  {analyzing ? "Analyzing spreadsheet..." : "Click or drag spreadsheet here"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supported formats: <strong>.csv</strong>, <strong>.xlsx</strong>, <strong>.xls</strong> (up to 15MB)
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={analyzing}
                className="rounded-xl text-xs font-bold pointer-events-none mt-1"
              >
                Choose File from Device
              </Button>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-3 text-xs space-y-1.5">
              <p className="font-extrabold text-foreground">Supported Record Types:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-muted-foreground text-[11px]">
                <li>• <strong>Milk Records:</strong> Cow Tag, Date, Morning/Evening Milk</li>
                <li>• <strong>Cattle Herd:</strong> Tag, Breed, Weight, Yield, Pen</li>
                <li>• <strong>Feeding Logs:</strong> Date, Feed Type, Quantity, Group</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: SCHEMA & COLUMN MAPPING */}
        {step === "MAPPING" && analysisResult && (
          <div className="space-y-4 py-3">
            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Detected Record Type: <strong>{analysisResult.recordTypeLabel}</strong>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  File: {analysisResult.fileName} · {analysisResult.totalRows} rows parsed
                </p>
              </div>
              <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                95% Match Confidence
              </span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">
                Column Mapping (External Column → Jharanai Database Field)
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Confirm or adjust which spreadsheet column maps to each farm record property.
              </p>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {analysisResult.rawHeaders.map((header) => {
                  const currentTarget = customMappings[header] || "";
                  return (
                    <div
                      key={header}
                      className="flex items-center justify-between p-2.5 text-xs bg-card hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{header}</span>
                        <ArrowRight className="size-3.5 text-muted-foreground" />
                      </div>

                      <select
                        value={currentTarget}
                        onChange={(e) =>
                          setCustomMappings({ ...customMappings, [header]: e.target.value })
                        }
                        className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary"
                      >
                        <option value="">-- Do Not Import --</option>
                        {analysisResult.availableFields.map((field) => (
                          <option key={field.key} value={field.key}>
                            {field.label} {field.required ? "(Required)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("UPLOAD")}
                className="rounded-xl"
              >
                Back to File
              </Button>
              <Button
                size="sm"
                onClick={handleProceedToPreview}
                className="gap-1.5 rounded-xl bg-primary text-primary-foreground font-extrabold"
              >
                Preview Records ({analysisResult.totalRows})
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & CONFLICT DETECTION */}
        {step === "PREVIEW" && analysisResult && (
          <div className="space-y-4 py-2">
            {/* Metric Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-xl border border-border/70 bg-card p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Rows</span>
                <p className="text-lg font-black text-foreground">{analysisResult.totalRows}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Valid</span>
                <p className="text-lg font-black text-emerald-800 dark:text-emerald-300">{analysisResult.validCount}</p>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300">Updates / Matches</span>
                <p className="text-lg font-black text-blue-800 dark:text-blue-300">{analysisResult.conflictCount}</p>
              </div>
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-center">
                <span className="text-[10px] uppercase font-bold text-destructive">Errors</span>
                <p className="text-lg font-black text-destructive">{analysisResult.errorCount}</p>
              </div>
            </div>

            {/* Validation Table / Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-bold text-foreground">Record Synchronization Preview</Label>
                <span className="text-muted-foreground text-[11px]">
                  Showing first {Math.min(analysisResult.previewRows.length, 10)} of {analysisResult.totalRows} rows
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border text-xs">
                {analysisResult.previewRows.slice(0, 10).map((row) => (
                  <div key={row.rowNumber} className="p-3 bg-card hover:bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">Row #{row.rowNumber}</span>
                        <span className="font-extrabold text-foreground">
                          {row.data["cow_tag"] || row.data["cow_id"] || row.data["feed_type"] || "Record"}
                        </span>
                        {row.data["record_date"] && (
                          <span className="text-muted-foreground text-[11px]">({row.data["record_date"]})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {row.action === "UPDATE" && (
                          <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] font-extrabold text-blue-800 dark:text-blue-300">
                            UPDATE EXISTING
                          </span>
                        )}
                        {row.action === "CREATE" && (
                          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                            NEW RECORD
                          </span>
                        )}
                        {row.status === "ERROR" && (
                          <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-[10px] font-extrabold text-destructive">
                            ERROR
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Diff comparison if UPDATE */}
                    {row.existingData && (
                      <div className="rounded-lg bg-blue-500/10 p-2 text-[11px] text-blue-900 dark:text-blue-200">
                        <strong>Change detected: </strong>
                        Existing in DB: {JSON.stringify(row.existingData)} → New Import: {JSON.stringify(row.data)}
                      </div>
                    )}

                    {/* Errors if any */}
                    {row.errors && row.errors.length > 0 && (
                      <p className="text-[11px] text-destructive font-medium">
                        ⚠️ {row.errors.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Checkbox: Import only valid */}
            {analysisResult.errorCount > 0 && (
              <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer bg-muted/40 p-2.5 rounded-xl border border-border">
                <input
                  type="checkbox"
                  checked={importOnlyValid}
                  onChange={(e) => setImportOnlyValid(e.target.checked)}
                  className="rounded border-border"
                />
                <span>Skip {analysisResult.errorCount} row(s) with errors and import only valid records</span>
              </label>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("MAPPING")}
                className="rounded-xl"
              >
                Back to Mapping
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteImport}
                disabled={confirming || (analysisResult.validCount === 0 && importOnlyValid)}
                className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md shadow-emerald-600/20"
              >
                {confirming ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Synchronizing database...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Confirm & Apply ({analysisResult.validCount + (analysisResult.conflictCount || 0)}) Records
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: RESULT */}
        {step === "RESULT" && confirmResult && (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-foreground">Import Synchronization Complete</h3>
              <p className="text-xs text-muted-foreground">
                Batch Code: <strong className="font-mono text-foreground">{confirmResult.batchCode}</strong>
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 text-left">
              <div className="rounded-xl border border-border bg-card p-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Rows</span>
                <p className="text-lg font-extrabold text-foreground">{confirmResult.totalRows}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Created</span>
                <p className="text-lg font-extrabold text-emerald-800 dark:text-emerald-300">{confirmResult.createdCount}</p>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
                <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300">Updated</span>
                <p className="text-lg font-extrabold text-blue-800 dark:text-blue-300">{confirmResult.updatedCount}</p>
              </div>
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                <span className="text-[10px] uppercase font-bold text-destructive">Errors</span>
                <p className="text-lg font-extrabold text-destructive">{confirmResult.errorCount}</p>
              </div>
            </div>

            {/* Error report download if errors exist */}
            {confirmResult.errorDetails && confirmResult.errorDetails.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-left">
                <div className="text-xs">
                  <p className="font-bold text-destructive">Errors occurred during import</p>
                  <p className="text-muted-foreground text-[11px]">{confirmResult.errorCount} row(s) could not be processed</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    importService.downloadErrorReport(
                      confirmResult.batchCode,
                      confirmResult.errorDetails || []
                    )
                  }
                  className="h-8 gap-1.5 text-xs font-bold text-destructive border-destructive/40 hover:bg-destructive/10"
                >
                  <Download className="size-3.5" /> Download Error Log
                </Button>
              </div>
            )}

            <Button
              onClick={() => {
                resetState();
                onOpenChange(false);
              }}
              className="w-full rounded-xl bg-primary text-primary-foreground font-extrabold"
            >
              Done & View Updated Farm
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
