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
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Analyze uploaded file, detect schema/type, auto-map columns, and produce validation preview")
    public ResponseEntity<ApiResponse<ImportAnalyzeResult>> analyzeFile(
            @RequestParam("file") MultipartFile file) throws Exception {
        ImportAnalyzeResult result = importEngineService.analyzeFile(file);
        return ResponseEntity.ok(ApiResponse.ok("File analyzed successfully", result));
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Confirm and commit import records into database with audit history")
    public ResponseEntity<ApiResponse<ImportConfirmResult>> confirmImport(
            @Valid @RequestBody ImportConfirmRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        UUID userId = userPrincipal != null ? userPrincipal.getId() : null;
        String userName = userPrincipal != null ? userPrincipal.getFullName() : "Admin";

        ImportConfirmResult result = importEngineService.confirmImport(request, userId, userName);
        return ResponseEntity.ok(ApiResponse.ok(result.getMessage(), result));
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
