package com.dairyfarm.app.modules.feed.controller;

import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.exception.ResourceNotFoundException;
import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.animal.repository.AnimalRepository;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import com.dairyfarm.app.modules.feed.model.FeedRecord;
import com.dairyfarm.app.modules.feed.repository.FeedRecordRepository;
import com.dairyfarm.app.modules.stock.service.StockService;
import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/feeding")
@Tag(name = "Feeding & Rations", description = "Endpoints for recording animal/group feeding and stock consumption")
public class FeedingController {

    private final FeedRecordRepository feedRecordRepository;
    private final AnimalRepository animalRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final StockService stockService;

    public FeedingController(
            FeedRecordRepository feedRecordRepository,
            AnimalRepository animalRepository,
            FarmRepository farmRepository,
            UserRepository userRepository,
            StockService stockService
    ) {
        this.feedRecordRepository = feedRecordRepository;
        this.animalRepository = animalRepository;
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
        this.stockService = stockService;
    }

    private UUID getTenantFarmId() {
        UUID farmId = TenantContext.getFarmId();
        if (farmId == null) {
            return UUID.fromString("a0000000-0000-0000-0000-000000000001");
        }
        return farmId;
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get feeding records")
    public ResponseEntity<Map<String, Object>> getFeedingRecords(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) UUID animalId
    ) {
        UUID farmId = getTenantFarmId();
        List<FeedRecord> list;
        if (animalId != null) {
            list = feedRecordRepository.findByFarmIdAndAnimalIdOrderByRecordDateDescCreatedAtDesc(farmId, animalId);
        } else if (fromDate != null && toDate != null) {
            list = feedRecordRepository.findByFarmIdAndRecordDateBetweenOrderByRecordDateDescCreatedAtDesc(farmId, fromDate, toDate);
        } else {
            list = feedRecordRepository.findByFarmIdOrderByRecordDateDescCreatedAtDesc(farmId);
        }

        return ResponseEntity.ok(Map.of("success", true, "data", list));
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('MANAGER', 'WORKER', 'ADMIN')")
    @org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
    @Operation(summary = "Record group or individual animal feeding round and auto-deduct stock consumption")
    public ResponseEntity<Map<String, Object>> recordFeeding(@RequestBody Map<String, Object> body) {
        UUID farmId = getTenantFarmId();
        UUID currentUserId = TenantContext.getUserId();
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        String feedType = body.get("feedType") != null ? body.get("feedType").toString().trim() : "Green Fodder";
        String groupName = body.get("groupName") != null ? body.get("groupName").toString().trim() : "All Animals";
        LocalDate date = body.get("recordDate") != null ? LocalDate.parse(body.get("recordDate").toString()) : LocalDate.now();

        BigDecimal qty = BigDecimal.ZERO;
        if (body.get("quantityKg") != null) {
            qty = new BigDecimal(body.get("quantityKg").toString());
        }
        if (qty.compareTo(BigDecimal.ZERO) <= 0) {
            throw new com.dairyfarm.app.common.exception.BadRequestException("Feeding quantity must be greater than zero");
        }

        // Resolve animal by Cow Number (ear tag) or animalId
        Animal animal = null;
        Object rawCowIdent = body.get("cowNumber");
        if (rawCowIdent == null) rawCowIdent = body.get("animalNumber");
        if (rawCowIdent == null) rawCowIdent = body.get("earTag");
        if (rawCowIdent == null) rawCowIdent = body.get("tag");
        if (rawCowIdent == null) rawCowIdent = body.get("animalId");

        if (rawCowIdent != null && !rawCowIdent.toString().isBlank()) {
            String ident = rawCowIdent.toString().trim();
            try {
                UUID aId = UUID.fromString(ident);
                animal = animalRepository.findByIdAndFarmId(aId, farmId).orElse(null);
            } catch (IllegalArgumentException ignored) {}

            if (animal == null) {
                animal = animalRepository.findByFarmIdAndEarTagIgnoreCase(farmId, ident)
                        .orElseThrow(() -> new com.dairyfarm.app.common.exception.BadRequestException("No animal found with Cow Number '" + ident + "' on this farm"));
            }
        }

        String notes = body.get("notes") != null ? body.get("notes").toString() : null;
        String recordedBy = currentUser != null ? currentUser.getFullName() : "Farm Worker";

        // 1. Create Feeding Record
        FeedRecord record = FeedRecord.builder()
                .farm(farm)
                .animal(animal)
                .feedType(feedType)
                .groupName(groupName)
                .quantityKg(qty)
                .recordDate(date)
                .recordedBy(recordedBy)
                .sourceType("MANUAL")
                .notes(notes)
                .createdBy(currentUserId)
                .build();

        FeedRecord saved = feedRecordRepository.save(record);

        // 2. Automatically record stock consumption in the stock ledger
        UUID feedItemId = null;
        if (body.get("feedItemId") != null && !body.get("feedItemId").toString().isBlank()) {
            try {
                feedItemId = UUID.fromString(body.get("feedItemId").toString().trim());
            } catch (IllegalArgumentException ignored) {
                // Non-UUID ID provided; fallback to item lookup
            }
        }

        var tx = stockService.recordTransaction(
                null,
                feedItemId,
                feedType,
                "CONSUMPTION",
                qty,
                "KG",
                date,
                "FEEDING",
                saved.getId(),
                "Feeding for " + groupName + (animal != null ? " (Cow #" + animal.getEarTag() + ")" : "")
        );

        return new ResponseEntity<>(Map.of(
                "success", true,
                "data", saved,
                "transaction", tx,
                "message", "Feeding recorded and stock deducted."
        ), HttpStatus.CREATED);
    }
}
