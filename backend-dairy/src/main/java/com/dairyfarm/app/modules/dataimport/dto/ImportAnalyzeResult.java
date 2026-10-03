package com.dairyfarm.app.modules.dataimport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportAnalyzeResult {

    private String fileName;
    private String recordType; // MILK_RECORD, COW_RECORD, FEED_RECORD
    private String recordTypeLabel;
    private double confidence;
    private int totalRows;
    private int validCount;
    private int warningCount;
    private int errorCount;
    private int conflictCount;

    private List<String> rawHeaders;
    private Map<String, String> detectedMappings; // rawHeader -> targetField
    private List<FieldDefinition> availableFields;

    private List<PreviewRow> previewRows;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldDefinition {
        private String key;
        private String label;
        private boolean required;
        private String sample;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreviewRow {
        private int rowNumber;
        private String status; // VALID, WARNING, ERROR
        private String action; // CREATE, UPDATE, UNCHANGED, ERROR
        private Map<String, Object> data;
        private Map<String, Object> existingData; // For diff/conflict review
        private List<String> warnings;
        private List<String> errors;
    }
}
