package com.dairyfarm.app.modules.report.service;

public final class ExportSecurityUtil {

    private ExportSecurityUtil() {}

    /**
     * Prevents CSV/Excel formula injection (CWE-1236).
     * If a cell starts with =, +, -, @, \t, \r, it prepends a single quote (').
     */
    public static String sanitizeForSpreadsheet(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        char firstChar = value.charAt(0);
        if (firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' || firstChar == '\t' || firstChar == '\r') {
            return "'" + value;
        }
        return value;
    }

    /**
     * Escapes standard CSV value with RFC 4180 rules.
     */
    public static String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        String sanitized = sanitizeForSpreadsheet(value);
        if (sanitized.contains(",") || sanitized.contains("\"") || sanitized.contains("\n") || sanitized.contains("\r")) {
            return "\"" + sanitized.replace("\"", "\"\"") + "\"";
        }
        return sanitized;
    }
}
