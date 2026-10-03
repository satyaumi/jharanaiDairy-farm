import { authService } from "./auth-service";
import { apiUrl } from "@/lib/api-config";

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  sample?: string;
  description?: string;
}

export interface PreviewRow {
  rowNumber: number;
  status: "VALID" | "WARNING" | "ERROR";
  action: "CREATE" | "UPDATE" | "UNCHANGED" | "ERROR";
  data: Record<string, any>;
  existingData?: Record<string, any> | null;
  warnings?: string[];
  errors?: string[];
}

export interface ImportAnalyzeResult {
  fileName: string;
  recordType: string;
  recordTypeLabel: string;
  confidence: number;
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  conflictCount: number;
  rawHeaders: string[];
  detectedMappings: Record<string, string>;
  availableFields: FieldDefinition[];
  previewRows: PreviewRow[];
}

export interface ImportConfirmRequest {
  recordType: string;
  fileName: string;
  importOnlyValid?: boolean;
  mappings: Record<string, string>;
  rows: Record<string, string>[];
}

export interface ImportConfirmResult {
  batchCode: string;
  fileName: string;
  recordType: string;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  status: string;
  message: string;
  errorDetails?: { row: number; field?: string; error: string }[];
}

export interface ImportBatch {
  id: string;
  batchCode: string;
  fileName: string;
  recordType: string;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  status: string;
  errorLog?: string;
  importedByName?: string;
  createdAt: string;
}

function getAuthHeaders(): HeadersInit {
  const token = authService.getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const importService = {
  async analyzeFile(file: File): Promise<ImportAnalyzeResult> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(apiUrl("/import/analyze"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || "Failed to analyze file");
    }

    const json = await response.json();
    return json.data;
  },

  async confirmImport(request: ImportConfirmRequest): Promise<ImportConfirmResult> {
    const response = await fetch(apiUrl("/import/confirm"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.message || "Failed to process import");
    }

    const json = await response.json();
    return json.data;
  },

  async getImportHistory(): Promise<ImportBatch[]> {
    try {
      const response = await fetch(apiUrl("/import/history"), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const json = await response.json();
        return json.data || [];
      }
    } catch {
      // Return empty list on network error
    }
    return [];
  },

  downloadErrorReport(batchCode: string, errors: { row: number; field?: string; error: string }[]): void {
    const rows = [
      ["Row Number", "Target Field", "Issue Detected", "Recommended Action"],
      ...errors.map((e) => [
        String(e.row),
        e.field || "General",
        `"${(e.error || "").replace(/"/g, '""')}"`,
        "Verify in source spreadsheet and re-import",
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Import_Error_Report_${batchCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
