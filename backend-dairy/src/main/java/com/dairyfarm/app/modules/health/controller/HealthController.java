package com.dairyfarm.app.modules.health.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Tag(name = "Health Check", description = "Public health monitoring endpoint")
public class HealthController {

    @GetMapping({"/health", "/api/health"})
    @Operation(summary = "Get system health status")
    public ResponseEntity<Map<String, String>> checkHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "service", "dairy-farm-backend"
        ));
    }
}
