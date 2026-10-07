package com.dairyfarm.app.modules.feed.controller;

import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.exception.DuplicateResourceException;
import com.dairyfarm.app.common.exception.ResourceNotFoundException;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import com.dairyfarm.app.modules.feed.model.FeedItem;
import com.dairyfarm.app.modules.feed.repository.FeedItemRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/feed-items")
@RequiredArgsConstructor
@Tag(name = "Feed Item Master", description = "Endpoints for configuring bilingual feed types and rations")
public class FeedItemController {

    private final FeedItemRepository feedItemRepository;
    private final FarmRepository farmRepository;

    private UUID getTenantFarmId() {
        UUID farmId = TenantContext.getFarmId();
        if (farmId == null) {
            return UUID.fromString("a0000000-0000-0000-0000-000000000001");
        }
        return farmId;
    }

    @GetMapping
    @Operation(summary = "List all configurable feed items")
    public ResponseEntity<Map<String, Object>> listFeedItems(@RequestParam(required = false, defaultValue = "false") boolean all) {
        UUID farmId = getTenantFarmId();
        List<FeedItem> items = all
                ? feedItemRepository.findByFarmIdOrderByDisplayNameAsc(farmId)
                : feedItemRepository.findByFarmIdAndActiveTrueOrderByDisplayNameAsc(farmId);

        return ResponseEntity.ok(Map.of("success", true, "data", items));
    }

    @PostMapping
    @Operation(summary = "Add a new feed item to the master catalog")
    public ResponseEntity<Map<String, Object>> createFeedItem(@RequestBody Map<String, Object> body) {
        UUID farmId = getTenantFarmId();
        String localName = body.get("localName") != null ? body.get("localName").toString().trim() : "";
        String englishName = body.get("englishName") != null ? body.get("englishName").toString().trim() : "";
        String shortName = body.get("shortName") != null ? body.get("shortName").toString().trim() : "";
        String displayName = body.get("displayName") != null ? body.get("displayName").toString().trim() : "";

        if (displayName.isBlank()) {
            displayName = !localName.isBlank() && !englishName.isBlank()
                    ? localName + " (" + englishName + ")"
                    : (!localName.isBlank() ? localName : englishName);
        }

        if (displayName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Feed item name is required"));
        }

        if (feedItemRepository.existsByFarmIdAndDisplayName(farmId, displayName)) {
            throw new DuplicateResourceException("Feed item '" + displayName + "' already exists");
        }

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        String unit = body.get("unit") != null ? body.get("unit").toString().toUpperCase() : "KG";
        String category = body.get("category") != null ? body.get("category").toString().toUpperCase() : "CONCENTRATE";

        FeedItem item = FeedItem.builder()
                .farm(farm)
                .localName(localName.isBlank() ? displayName : localName)
                .englishName(englishName.isBlank() ? displayName : englishName)
                .shortName(shortName)
                .displayName(displayName)
                .unit(unit)
                .category(category)
                .defaultCostPerUnit(body.get("defaultCostPerUnit") != null ? new BigDecimal(body.get("defaultCostPerUnit").toString()) : BigDecimal.ZERO)
                .active(true)
                .build();

        FeedItem saved = feedItemRepository.save(item);
        return new ResponseEntity<>(Map.of("success", true, "data", saved), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edit feed item")
    public ResponseEntity<Map<String, Object>> updateFeedItem(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        UUID farmId = getTenantFarmId();
        FeedItem item = feedItemRepository.findByIdAndFarmId(id, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("FeedItem", "id", id));

        if (body.containsKey("displayName") && body.get("displayName") != null) {
            String dn = body.get("displayName").toString().trim();
            if (feedItemRepository.existsByFarmIdAndDisplayNameAndIdNot(farmId, dn, id)) {
                throw new DuplicateResourceException("Feed item '" + dn + "' already exists");
            }
            item.setDisplayName(dn);
        }
        if (body.containsKey("localName")) item.setLocalName(body.get("localName").toString().trim());
        if (body.containsKey("englishName")) item.setEnglishName(body.get("englishName").toString().trim());
        if (body.containsKey("shortName")) item.setShortName(body.get("shortName") != null ? body.get("shortName").toString().trim() : null);
        if (body.containsKey("unit")) item.setUnit(body.get("unit").toString().toUpperCase());
        if (body.containsKey("category")) item.setCategory(body.get("category").toString().toUpperCase());
        if (body.containsKey("active")) item.setActive(Boolean.parseBoolean(body.get("active").toString()));

        FeedItem saved = feedItemRepository.save(item);
        return ResponseEntity.ok(Map.of("success", true, "data", saved));
    }
}
