package com.dairyfarm.app.modules.report.controller;

import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.security.UserPrincipal;
import com.dairyfarm.app.modules.report.dto.ReportFilterRequest;
import com.dairyfarm.app.modules.report.service.ReportService;
import com.dairyfarm.app.modules.user.model.Role;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports & Exports", description = "Endpoints for generating and downloading farm audits in CSV, Excel, and PDF")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER', 'ADMIN')")
    @Operation(summary = "Export farm report in CSV, Excel (.xlsx), or PDF format")
    public ResponseEntity<byte[]> exportReport(
            @ModelAttribute ReportFilterRequest filter,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        try {
            // Worker role authorization check
            if (currentUser != null && currentUser.getRole() == Role.WORKER) {
                String mod = filter.getModule() != null ? filter.getModule().toLowerCase() : "";
                if ("team".equals(mod) || "audit".equals(mod) || "financial".equals(mod)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            }

            byte[] fileBytes = reportService.generateReport(filter);
            String filename = reportService.getFilename(filter);
            String contentType = reportService.getContentType(filter.getFormat());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
            headers.setContentLength(fileBytes.length);

            return new ResponseEntity<>(fileBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Failed to generate report export: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .header("X-Error-Message", e.getMessage())
                    .build();
        }
    }
}
