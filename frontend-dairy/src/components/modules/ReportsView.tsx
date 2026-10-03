import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Printer,
  Share2,
  UploadCloud,
  FileSpreadsheet,
  History,
  AlertCircle,
  FileCode,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExportModal } from "@/components/common/ExportModal";
import { ImportRecordsModal } from "@/components/common/ImportRecordsModal";
import { downloadReport } from "@/services/export-service";
import { importService, ImportBatch } from "@/services/import-service";

export function ReportsView() {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState("milk");
  const [modalTitle, setModalTitle] = useState("Export Farm Report");

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportBatch[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await importService.getImportHistory();
      setImportHistory(history);
    } catch (err) {
      console.error("Failed to load import history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const REPORTS = [
    {
      title: "Monthly Milk Yield & Dispatch Audit",
      module: "milk",
      period: "September 2026",
      size: "26,734 Litres Total",
      status: "Verified",
      description: "Daily milk production logs, AM/PM session splits, and quality parameters",
    },
    {
      title: "Herd Health & Cattle Inventory",
      module: "cows",
      period: "Q3 2026",
      size: "128 Head Inoculated",
      status: "Certified",
      description: "Full cattle registry with ear tags, breed, lactation cycle, and health ratings",
    },
    {
      title: "Feed & Fodder Consumption Ledger",
      module: "feeding",
      period: "Last 30 Days",
      size: "37,350 kg Total Used",
      status: "Audited",
      description: "Concentrate, green fodder, and silage usage partitioned by milking herds",
    },
    {
      title: "Farm Operational Performance Summary",
      module: "milk",
      period: "Annual 2026",
      size: "Complete Farm Overview",
      status: "Ready",
      description: "Consolidated commercial dairy performance metrics and audit balances",
    },
  ];

  const handleOpenExport = (moduleName: string, title: string) => {
    setSelectedModule(moduleName);
    setModalTitle(title);
    setExportModalOpen(true);
  };

  const handleDirectPrint = async (moduleName: string, repTitle: string) => {
    toast.info(`Preparing ${repTitle} (PDF)...`);
    try {
      await downloadReport({ module: moduleName, format: "pdf" });
      toast.success(`Generated printable PDF for ${repTitle}`);
    } catch (e: any) {
      toast.error("Print generation failed", { description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-purple-500/15 text-purple-800 dark:text-purple-300">
              <FileText className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Farm Reports & Data Synchronization
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Export certified statements (CSV, Excel, PDF) & synchronize external records for Jharanai Farm
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Import Records Button */}
          <Button
            onClick={() => setImportModalOpen(true)}
            variant="outline"
            className="h-11 gap-2 rounded-2xl border-emerald-500/30 bg-emerald-500/10 px-4 text-xs sm:text-sm font-extrabold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 active:scale-95"
          >
            <UploadCloud className="size-4.5" />
            Import Records
          </Button>

          {/* Download All Reports Button */}
          <Button
            onClick={() => handleOpenExport("milk", "Export Farm Audit Summary")}
            className="h-11 gap-2 rounded-2xl bg-purple-600 px-4 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-purple-600/30 hover:bg-purple-700 active:scale-95"
          >
            <Download className="size-4.5" />
            Export Farm Data
          </Button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
          <span>Certified Operational Reports</span>
          <span className="text-[11px] font-medium text-muted-foreground">(Available in CSV, XLSX, and PDF)</span>
        </h2>

        {REPORTS.map((rep) => (
          <div
            key={rep.title}
            className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 hover:bg-card transition-all sm:flex-row sm:items-center sm:justify-between shadow-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-extrabold text-foreground">{rep.title}</p>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                  {rep.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Period: <strong className="text-foreground">{rep.period}</strong> · Scope: {rep.size}
              </p>
              <p className="text-[11px] text-muted-foreground/80">{rep.description}</p>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-border/60 sm:border-t-0 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDirectPrint(rep.module, rep.title)}
                className="h-9 gap-1.5 rounded-xl text-xs font-bold"
              >
                <Printer className="size-3.5" /> Print / PDF
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenExport(rep.module, rep.title)}
                className="h-9 gap-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-bold shadow-sm shadow-purple-600/20"
              >
                <Download className="size-3.5" /> Download
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Import History Audit Section */}
      <div className="space-y-3 pt-4 border-t border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h2 className="text-sm font-extrabold text-foreground">External Import Audit History</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchHistory}
            className="h-7 text-[11px] text-muted-foreground font-bold hover:text-foreground"
          >
            Refresh Log
          </Button>
        </div>

        {importHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            <p className="font-bold text-foreground">No external files imported yet</p>
            <p className="mt-1">
              Upload spreadsheets (.xlsx, .csv) with milk logs, cows, or feed records to synchronize the farm.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              className="mt-3 rounded-xl gap-1.5 text-xs font-bold"
            >
              <UploadCloud className="size-3.5" /> Start First Import
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 font-extrabold text-muted-foreground text-[11px]">
                <tr>
                  <th className="p-3">Batch Code</th>
                  <th className="p-3">Source File</th>
                  <th className="p-3">Record Type</th>
                  <th className="p-3">Processed</th>
                  <th className="p-3">Created / Updated</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Imported By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {importHistory.map((batch) => (
                  <tr key={batch.id} className="hover:bg-muted/30">
                    <td className="p-3 font-mono font-bold text-foreground">{batch.batchCode}</td>
                    <td className="p-3 font-medium text-foreground">{batch.fileName}</td>
                    <td className="p-3 text-muted-foreground">{batch.recordType}</td>
                    <td className="p-3 font-semibold">{batch.totalRows} rows</td>
                    <td className="p-3">
                      <span className="text-emerald-800 dark:text-emerald-300 font-bold">+{batch.createdCount}</span>
                      {" / "}
                      <span className="text-blue-800 dark:text-blue-300 font-bold">~{batch.updatedCount}</span>
                      {batch.errorCount > 0 && (
                        <span className="text-destructive font-bold ml-1.5">({batch.errorCount} errors)</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                          batch.status === "COMPLETED"
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                            : batch.status === "FAILED"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{batch.importedByName || "Admin"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mount Common Export & Import Modals */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        defaultModule={selectedModule}
        title={modalTitle}
      />

      <ImportRecordsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportSuccess={() => {
          fetchHistory();
        }}
      />
    </div>
  );
}
