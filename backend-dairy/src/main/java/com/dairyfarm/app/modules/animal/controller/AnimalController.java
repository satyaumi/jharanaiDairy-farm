package com.dairyfarm.app.modules.animal.controller;

import com.dairyfarm.app.common.api.ApiResponse;
import com.dairyfarm.app.common.api.PagedResponse;
import com.dairyfarm.app.modules.animal.dto.*;
import com.dairyfarm.app.modules.animal.model.AnimalType;
import com.dairyfarm.app.modules.animal.service.AnimalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/animals")
@RequiredArgsConstructor
@Tag(name = "Animal Management", description = "Endpoints for farm herd inventory and lifecycle history")
public class AnimalController {

    private final AnimalService animalService;

    @GetMapping
    @Operation(summary = "Get paginated animals with optional search, status, and breed filters")
    public ResponseEntity<ApiResponse<PagedResponse<AnimalDto>>> getAnimals(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) AnimalType type,
            @RequestParam(required = false) String breed,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {

        Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort.length >= 2) {
            Sort.Direction dir = sort[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
            sortObj = Sort.by(dir, sort[0]);
        }

        Pageable pageable = PageRequest.of(page, size, sortObj);
        PagedResponse<AnimalDto> response = animalService.getAnimals(search, status, type, breed, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all active animals for dropdown selection (e.g. parent selectors)")
    public ResponseEntity<ApiResponse<List<AnimalDto>>> getAllActiveAnimals() {
        List<AnimalDto> animals = animalService.getAllActiveAnimals();
        return ResponseEntity.ok(ApiResponse.ok(animals));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed animal profile by ID")
    public ResponseEntity<ApiResponse<AnimalDto>> getAnimalById(@PathVariable UUID id) {
        AnimalDto animal = animalService.getAnimalById(id);
        return ResponseEntity.ok(ApiResponse.ok(animal));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER', 'ADMIN')")
    @Operation(summary = "Create an animal (supports fast 3-field entry and optional History section)")
    public ResponseEntity<ApiResponse<AnimalDto>> createAnimal(@Valid @RequestBody CreateAnimalRequest request) {
        AnimalDto created = animalService.createAnimal(request);
        return new ResponseEntity<>(ApiResponse.ok("Animal created successfully", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Update core animal details")
    public ResponseEntity<ApiResponse<AnimalDto>> updateAnimal(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAnimalRequest request) {
        AnimalDto updated = animalService.updateAnimal(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Animal updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'ADMIN')")
    @Operation(summary = "Soft delete / archive an animal")
    public ResponseEntity<ApiResponse<Void>> deactivateAnimal(@PathVariable UUID id) {
        animalService.deactivateAnimal(id);
        return ResponseEntity.ok(ApiResponse.ok("Animal archived successfully", null));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get chronological lifecycle history events for an animal")
    public ResponseEntity<ApiResponse<List<AnimalHistoryDto>>> getAnimalHistory(@PathVariable UUID id) {
        List<AnimalHistoryDto> history = animalService.getAnimalHistory(id);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @PostMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER', 'ADMIN')")
    @Operation(summary = "Add a lifecycle event to animal history")
    public ResponseEntity<ApiResponse<AnimalHistoryDto>> addHistoryEvent(
            @PathVariable UUID id,
            @Valid @RequestBody CreateHistoryEventRequest request) {
        AnimalHistoryDto history = animalService.addHistoryEvent(id, request);
        return new ResponseEntity<>(ApiResponse.ok("History event recorded successfully", history), HttpStatus.CREATED);
    }
}
