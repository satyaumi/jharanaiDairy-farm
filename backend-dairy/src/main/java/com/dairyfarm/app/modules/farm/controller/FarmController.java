package com.dairyfarm.app.modules.farm.controller;

import com.dairyfarm.app.common.api.ApiResponse;
import com.dairyfarm.app.modules.farm.dto.CreateFarmRequest;
import com.dairyfarm.app.modules.farm.dto.FarmDto;
import com.dairyfarm.app.modules.farm.service.FarmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/farms")
@RequiredArgsConstructor
@Tag(name = "Farm Tenant Management", description = "Endpoints for farm tenants")
public class FarmController {

    private final FarmService farmService;

    @GetMapping("/current")
    @Operation(summary = "Get current authenticated user's farm details")
    public ResponseEntity<ApiResponse<FarmDto>> getCurrentFarm() {
        return ResponseEntity.ok(ApiResponse.ok(farmService.getCurrentFarm()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new farm tenant (Admin only)")
    public ResponseEntity<ApiResponse<FarmDto>> createFarm(@Valid @RequestBody CreateFarmRequest request) {
        FarmDto created = farmService.createFarm(request);
        return new ResponseEntity<>(ApiResponse.ok("Farm created successfully", created), HttpStatus.CREATED);
    }
}
