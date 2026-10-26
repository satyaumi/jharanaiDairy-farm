package com.dairyfarm.app.modules.dataimport.controller;

import com.dairyfarm.app.common.api.ApiResponse;
import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.security.UserPrincipal;
import com.dairyfarm.app.modules.dataimport.dto.ImportAnalyzeResult;
import com.dairyfarm.app.modules.dataimport.dto.ImportConfirmRequest;
import com.dairyfarm.app.modules.dataimport.dto.ImportConfirmResult;
import com.dairyfarm.app.modules.dataimport.model.ImportBatch;
import com.dairyfarm.app.modules.dataimport.repository.ImportBatchRepository;
import com.dairyfarm.app.modules.dataimport.service.ImportEngineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
@Tag(name = "Data Import & Synchronization", description = "Endpoints for parsing external Excel/CSV files, mapping columns, validating records, and transactional upserting")
public class ImportController {

    private final ImportEngineService importEngineService;
    private final ImportBatchRepository importBatchRepository;

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('WORKER', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Analyze uploaded file, detect schema/type, auto-map columns, and produce validation preview")
    public ResponseEntity<ApiResponse<ImportAnalyzeResult>> analyzeFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "recordType", required = false) String expectedType,
            @RequestParam(value = "sheetName", required = false) String sheetName,
            @AuthenticationPrincipal UserPrincipal userPrincipal) throws Exception {
        UUID farmId = userPrincipal != null ? userPrincipal.getFarmId() : null;
        ImportAnalyzeResult result = importEngineService.analyzeFile(file, expectedType, farmId, sheetName);
        return ResponseEntity.ok(ApiResponse.ok("File analyzed successfully", result));
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasAnyRole('WORKER', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Confirm and commit import records into database with audit history")
    public ResponseEntity<ApiResponse<ImportConfirmResult>> confirmImport(
            @Valid @RequestBody ImportConfirmRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        UUID userId = userPrincipal != null ? userPrincipal.getId() : null;
        String userName = userPrincipal != null ? userPrincipal.getFullName() : "Worker";

        // Role restriction: Worker may only import operational milk, cow, and feed records
        if (userPrincipal != null && userPrincipal.getRole() == com.dairyfarm.app.modules.user.model.Role.WORKER) {
            String type = request.getRecordType() != null ? request.getRecordType().toUpperCase() : "";
            if (!List.of("MILK_RECORD", "COW_RECORD", "FEED_RECORD").contains(type)) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Workers are only authorized for operational milk, cow, and feed imports."));
            }
        }

        ImportConfirmResult result = importEngineService.confirmImport(request, userId, userName);
        return ResponseEntity.ok(ApiResponse.ok(result.getMessage(), result));
    }

    @GetMapping("/template")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN', 'WORKER')")
    @Operation(summary = "Download sample CSV or Excel import template for Milk or Cow records")
    public ResponseEntity<byte[]> downloadTemplate(
            @RequestParam(value = "type", defaultValue = "MILK_RECORD") String type,
            @RequestParam(value = "format", defaultValue = "csv") String format) throws Exception {
        byte[] bytes = importEngineService.generateTemplate(type, format);
        String ext = "xlsx".equalsIgnoreCase(format) ? "xlsx" : "csv";
        String contentType = "xlsx".equalsIgnoreCase(format)
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "text/csv; charset=UTF-8";
        String label = "COW_RECORD".equalsIgnoreCase(type) ? "Cattle_Herd" : "Milk_Harvest";
        String filename = String.format("Jharanai_Farm_%s_Template.%s", label, ext);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        headers.setContentLength(bytes.length);

        return new ResponseEntity<>(bytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER', 'ADMIN')")
    @Operation(summary = "Get history of import batches")
    public ResponseEntity<ApiResponse<List<ImportBatch>>> getImportHistory() {
        UUID farmId = TenantContext.getFarmId();
        if (farmId == null) {
            farmId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        }
        List<ImportBatch> history = importBatchRepository.findByFarmIdOrderByCreatedAtDesc(farmId);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }
}
