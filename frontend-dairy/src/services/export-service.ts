import { authService } from "./auth-service";
import { apiUrl } from "@/lib/api-config";

export interface ReportExportParams {
  module?: ("milk" | "cows" | "feeding" | "health" | "production" | "stock" | "summary" | string) | undefined;
  format?: ("csv" | "xlsx" | "pdf") | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  shift?: string | undefined;
  cowTag?: string | undefined;
  status?: string | undefined;
  limit?: number | undefined;
  recordScope?: string | undefined;
}

export async function downloadReport(params: ReportExportParams): Promise<{ success: boolean; filename: string }> {
  const token = authService.getToken();
  const query = new URLSearchParams();

  if (params.module) query.set("module", params.module);
  if (params.format) query.set("format", params.format);
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.shift && params.shift !== "all") query.set("shift", params.shift);
  if (params.cowTag && params.cowTag !== "all") query.set("cowTag", params.cowTag);
  if (params.status) query.set("status", params.status);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.recordScope) query.set("recordScope", params.recordScope);

  const response = await fetch(apiUrl(`/reports/export?${query.toString()}`), {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorMsg = response.headers.get("X-Error-Message") || `Export failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  // Extract filename from Content-Disposition header if available
  const disposition = response.headers.get("Content-Disposition");
  let filename = `Jharanai_Farm_${params.module || "Report"}_${new Date().toISOString().split("T")[0]}.${params.format || "csv"}`;

  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, "").trim();
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(blobUrl);

  return { success: true, filename };
}
