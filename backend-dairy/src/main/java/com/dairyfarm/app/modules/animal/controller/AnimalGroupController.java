package com.dairyfarm.app.modules.animal.controller;

import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.exception.DuplicateResourceException;
import com.dairyfarm.app.common.exception.ResourceNotFoundException;
import com.dairyfarm.app.modules.animal.dto.AnimalDto;
import com.dairyfarm.app.modules.animal.dto.AnimalGroupDto;
import com.dairyfarm.app.modules.animal.model.AnimalGroup;
import com.dairyfarm.app.modules.animal.repository.AnimalGroupRepository;
import com.dairyfarm.app.modules.animal.repository.AnimalRepository;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Tag(name = "Animal Groups", description = "Endpoints for managing herd groups and operational grouping")
public class AnimalGroupController {

    private final AnimalGroupRepository groupRepository;
    private final AnimalRepository animalRepository;
    private final FarmRepository farmRepository;

    private UUID getTenantFarmId() {
        UUID farmId = TenantContext.getFarmId();
        if (farmId == null) {
            return UUID.fromString("a0000000-0000-0000-0000-000000000001");
        }
        return farmId;
    }

    @GetMapping
    @Operation(summary = "List all herd groups with animal counts")
    public ResponseEntity<Map<String, Object>> listGroups(@RequestParam(required = false, defaultValue = "false") boolean all) {
        UUID farmId = getTenantFarmId();
        List<AnimalGroup> groups = all
                ? groupRepository.findByFarmIdOrderByNameAsc(farmId)
                : groupRepository.findByFarmIdAndActiveTrueOrderByNameAsc(farmId);

        List<AnimalGroupDto> dtos = groups.stream().map(g -> {
            long count = animalRepository.countByFarmIdAndGroupId(farmId, g.getId());
            return AnimalGroupDto.fromEntity(g, count);
        }).toList();

        return ResponseEntity.ok(Map.of("success", true, "data", dtos));
    }

    @PostMapping
    @Operation(summary = "Create animal group")
    public ResponseEntity<Map<String, Object>> createGroup(@RequestBody Map<String, String> body) {
        UUID farmId = getTenantFarmId();
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Group name is required"));
        }
        String cleanName = name.trim();
        if (groupRepository.existsByFarmIdAndName(farmId, cleanName)) {
            throw new DuplicateResourceException("Group with name '" + cleanName + "' already exists");
        }

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        AnimalGroup group = AnimalGroup.builder()
                .farm(farm)
                .name(cleanName)
                .code(body.get("code") != null ? body.get("code").trim() : null)
                .description(body.get("description") != null ? body.get("description").trim() : null)
                .active(true)
                .build();

        AnimalGroup saved = groupRepository.save(group);
        return new ResponseEntity<>(Map.of("success", true, "data", AnimalGroupDto.fromEntity(saved, 0)), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update animal group")
    public ResponseEntity<Map<String, Object>> updateGroup(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        UUID farmId = getTenantFarmId();
        AnimalGroup group = groupRepository.findByIdAndFarmId(id, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("AnimalGroup", "id", id));

        if (body.containsKey("name") && body.get("name") != null) {
            String cleanName = body.get("name").toString().trim();
            if (groupRepository.existsByFarmIdAndNameAndIdNot(farmId, cleanName, id)) {
                throw new DuplicateResourceException("Group with name '" + cleanName + "' already exists");
            }
            group.setName(cleanName);
        }
        if (body.containsKey("code")) {
            group.setCode(body.get("code") != null ? body.get("code").toString().trim() : null);
        }
        if (body.containsKey("description")) {
            group.setDescription(body.get("description") != null ? body.get("description").toString().trim() : null);
        }
        if (body.containsKey("active")) {
            group.setActive(Boolean.parseBoolean(body.get("active").toString()));
        }

        AnimalGroup saved = groupRepository.save(group);
        long count = animalRepository.countByFarmIdAndGroupId(farmId, saved.getId());
        return ResponseEntity.ok(Map.of("success", true, "data", AnimalGroupDto.fromEntity(saved, count)));
    }

    @GetMapping("/{id}/animals")
    @Operation(summary = "Get animals belonging to a specific group for fast operations like milking")
    public ResponseEntity<Map<String, Object>> getGroupAnimals(@PathVariable UUID id) {
        UUID farmId = getTenantFarmId();
        List<AnimalDto> animals = animalRepository.findByFarmIdAndGroupIdAndActiveTrue(farmId, id).stream()
                .map(AnimalDto::fromEntity)
                .toList();

        return ResponseEntity.ok(Map.of("success", true, "data", animals));
    }
}
