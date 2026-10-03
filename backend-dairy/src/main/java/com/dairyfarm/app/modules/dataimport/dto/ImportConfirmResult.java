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
public class ImportConfirmResult {

    private String batchCode;
    private String fileName;
    private String recordType;
    private int totalRows;
    private int createdCount;
    private int updatedCount;
    private int skippedCount;
    private int errorCount;
    private String status;
    private String message;
    private List<Map<String, Object>> errorDetails;
}
