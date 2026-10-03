package com.dairyfarm.app.modules.user.controller;

import com.dairyfarm.app.common.api.ApiResponse;
import com.dairyfarm.app.modules.user.dto.*;
import com.dairyfarm.app.modules.user.model.Role;
import com.dairyfarm.app.modules.user.model.UserStatus;
import com.dairyfarm.app.modules.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Team & Operational User Management", description = "Endpoints for managing farm staff, roles, and workers")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
    @Operation(summary = "List all team members and workers in current farm")
    public ResponseEntity<ApiResponse<List<UserResponseDto>>> getFarmUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String department) {
        List<UserResponseDto> users = userService.getFarmUsers(search, role, status, department);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Get team role counts and activation metrics")
    public ResponseEntity<ApiResponse<TeamSummaryDto>> getTeamSummary() {
        TeamSummaryDto summary = userService.getTeamSummary();
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get detailed profile of a team member")
    public ResponseEntity<ApiResponse<UserResponseDto>> getUserById(@PathVariable UUID id) {
        UserResponseDto user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping("/workers")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Add a new farm worker profile (Owner or Manager)")
    public ResponseEntity<ApiResponse<UserResponseDto>> createWorker(@Valid @RequestBody CreateWorkerRequest request) {
        UserResponseDto worker = userService.createWorker(request);
        return new ResponseEntity<>(ApiResponse.ok("Worker account created successfully", worker), HttpStatus.CREATED);
    }

    @PostMapping("/management")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Add a management team member (Farm Owner only)")
    public ResponseEntity<ApiResponse<UserResponseDto>> createManagement(@Valid @RequestBody CreateManagementRequest request) {
        UserResponseDto manager = userService.createManagement(request);
        return new ResponseEntity<>(ApiResponse.ok("Management account created successfully", manager), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Update team member details")
    public ResponseEntity<ApiResponse<UserResponseDto>> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponseDto updated = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Activate, deactivate or suspend a team member")
    public ResponseEntity<ApiResponse<UserResponseDto>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request) {
        UserResponseDto updated = userService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("Status updated successfully", updated));
    }

    @PostMapping("/{id}/resend-invitation")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Resend activation invitation to team member")
    public ResponseEntity<ApiResponse<UserResponseDto>> resendInvitation(@PathVariable UUID id) {
        UserResponseDto updated = userService.resendInvitation(id);
        return ResponseEntity.ok(ApiResponse.ok("Invitation resent successfully", updated));
    }
}
