package com.dairyfarm.app.modules.alert.controller;

import com.dairyfarm.app.common.api.ApiResponse;
import com.dairyfarm.app.modules.alert.dto.AlertDto;
import com.dairyfarm.app.modules.alert.dto.CreateAlertRequest;
import com.dairyfarm.app.modules.alert.service.AlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
@Tag(name = "Farm Alerts", description = "Endpoints for role-targeted notifications, animal reminders, and emergency alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get alerts targeted to current user and role")
    public ResponseEntity<ApiResponse<List<AlertDto>>> getAlerts() {
        List<AlertDto> alerts = alertService.getAlertsForCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(alerts));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Create and dispatch a role-targeted farm alert (Management only)")
    public ResponseEntity<ApiResponse<AlertDto>> createAlert(@Valid @RequestBody CreateAlertRequest request) {
        AlertDto created = alertService.createAlert(request);
        return new ResponseEntity<>(ApiResponse.ok("Farm alert created and dispatched successfully", created), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark an alert as read by the current user")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id) {
        alertService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.ok("Alert marked as read", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Dismiss / resolve an alert (Management only)")
    public ResponseEntity<ApiResponse<Void>> dismissAlert(@PathVariable UUID id) {
        alertService.dismissAlert(id);
        return ResponseEntity.ok(ApiResponse.ok("Alert dismissed", null));
    }
}
