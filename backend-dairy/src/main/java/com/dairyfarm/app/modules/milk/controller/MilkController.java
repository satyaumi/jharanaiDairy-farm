package com.dairyfarm.app.modules.milk.controller;

import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.exception.BadRequestException;
import com.dairyfarm.app.common.exception.ResourceNotFoundException;
import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.animal.repository.AnimalRepository;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import com.dairyfarm.app.modules.milk.dto.MilkDto;
import com.dairyfarm.app.modules.milk.model.MilkRecord;
import com.dairyfarm.app.modules.milk.repository.MilkRecordRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/milk")
@Tag(name = "Milk Operations", description = "Endpoints for daily milk records, group-level entry, and summaries")
public class MilkController {

    private final MilkRecordRepository milkRecordRepository;
    private final AnimalRepository animalRepository;
    private final FarmRepository farmRepository;

    public MilkController(
            MilkRecordRepository milkRecordRepository,
            AnimalRepository animalRepository,
            FarmRepository farmRepository
    ) {
        this.milkRecordRepository = milkRecordRepository;
        this.animalRepository = animalRepository;
        this.farmRepository = farmRepository;
    }

    private UUID getTenantFarmId() {
        UUID farmId = TenantContext.getFarmId();
        if (farmId == null) {
            return UUID.fromString("a0000000-0000-0000-0000-000000000001");
        }
        return farmId;
    }

    private Animal resolveAnimal(UUID farmId, String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new BadRequestException("Cow Number is required to record milk");
        }
        String clean = identifier.trim();
        try {
            UUID id = UUID.fromString(clean);
            Optional<Animal> aOpt = animalRepository.findByIdAndFarmId(id, farmId);
            if (aOpt.isPresent()) return aOpt.get();
        } catch (IllegalArgumentException ignored) {}

        return animalRepository.findByFarmIdAndEarTagIgnoreCase(farmId, clean)
                .orElseThrow(() -> new BadRequestException("No animal found with Cow Number '" + clean + "' on this farm"));
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get milking records")
    public ResponseEntity<Map<String, Object>> getRecords(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) String animalId,
            @RequestParam(required = false) String cowNumber
    ) {
        UUID farmId = getTenantFarmId();
        List<MilkRecord> records;

        String targetAnimalIdent = (cowNumber != null && !cowNumber.isBlank()) ? cowNumber : animalId;
        UUID targetAnimalId = null;
        if (targetAnimalIdent != null && !targetAnimalIdent.isBlank()) {
            try {
                Animal a = resolveAnimal(farmId, targetAnimalIdent);
                targetAnimalId = a.getId();
            } catch (BadRequestException e) {
                // If nonexistent animal is queried, return empty list
                return ResponseEntity.ok(Map.of("success", true, "data", List.of()));
            }
        }

        if (targetAnimalId != null) {
            records = milkRecordRepository.findByFarmIdAndAnimalIdOrderByRecordDateDescCreatedAtDesc(farmId, targetAnimalId);
        } else if (date != null && shift != null && !shift.isBlank()) {
            records = milkRecordRepository.findByFarmIdAndRecordDateAndShift(farmId, date, shift);
        } else if (date != null) {
            records = milkRecordRepository.findByFarmIdAndRecordDateOrderByRecordDateDescCreatedAtDesc(farmId, date);
        } else {
            records = milkRecordRepository.findByFarmIdOrderByRecordDateDescCreatedAtDesc(farmId);
        }

        List<MilkDto> dtos = records.stream().map(MilkDto::fromEntity).toList();
        return ResponseEntity.ok(Map.of("success", true, "data", dtos));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get daily milk production summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        UUID farmId = getTenantFarmId();
        LocalDate targetDate = date != null ? date : LocalDate.now();

        List<MilkRecord> dayRecords = milkRecordRepository.findByFarmIdAndRecordDateOrderByRecordDateDescCreatedAtDesc(farmId, targetDate);

        BigDecimal morningTotal = BigDecimal.ZERO;
        BigDecimal eveningTotal = BigDecimal.ZERO;
        Set<UUID> cowsMilked = new HashSet<>();

        for (MilkRecord r : dayRecords) {
            BigDecimal l = r.getLitres() != null ? r.getLitres() : BigDecimal.ZERO;
            if ("Morning".equalsIgnoreCase(r.getShift())) {
                morningTotal = morningTotal.add(l);
            } else if ("Evening".equalsIgnoreCase(r.getShift())) {
                eveningTotal = eveningTotal.add(l);
            }
            cowsMilked.add(r.getAnimal().getId());
        }

        BigDecimal dayTotal = morningTotal.add(eveningTotal);

        Map<String, Object> summary = new HashMap<>();
        summary.put("date", targetDate);
        summary.put("totalLitres", dayTotal);
        summary.put("morningLitres", morningTotal);
        summary.put("eveningLitres", eveningTotal);
        summary.put("animalsMilkedCount", cowsMilked.size());
        summary.put("recordsCount", dayRecords.size());

        return ResponseEntity.ok(Map.of("success", true, "data", summary));
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER', 'ADMIN')")
    @Operation(summary = "Record individual animal milking")
    public ResponseEntity<Map<String, Object>> recordSingleMilk(@RequestBody Map<String, Object> body) {
        UUID farmId = getTenantFarmId();
        UUID currentUserId = TenantContext.getUserId();
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        Object rawCowIdent = body.get("cowNumber");
        if (rawCowIdent == null) rawCowIdent = body.get("animalNumber");
        if (rawCowIdent == null) rawCowIdent = body.get("earTag");
        if (rawCowIdent == null) rawCowIdent = body.get("tag");
        if (rawCowIdent == null) rawCowIdent = body.get("animalId");

        if (rawCowIdent == null || rawCowIdent.toString().isBlank()) {
            throw new BadRequestException("Cow Number is required to record milk");
        }

        Animal animal = resolveAnimal(farmId, rawCowIdent.toString());
        UUID animalId = animal.getId();

        LocalDate date = body.get("recordDate") != null ? LocalDate.parse(body.get("recordDate").toString()) : LocalDate.now();
        String shift = body.get("shift") != null ? body.get("shift").toString() : "Morning";

        if (body.get("litres") == null) {
            throw new BadRequestException("Litres amount is required");
        }
        BigDecimal litres = new BigDecimal(body.get("litres").toString());
        if (litres.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Litres must be non-negative");
        }

        // Check if record exists for animal/date/shift
        Optional<MilkRecord> existingOpt = milkRecordRepository.findByFarmIdAndAnimalIdAndRecordDateAndShift(farmId, animalId, date, shift);
        MilkRecord record;
        if (existingOpt.isPresent()) {
            record = existingOpt.get();
            record.setLitres(litres);
            if (body.get("notes") != null) record.setNotes(body.get("notes").toString());
            record.setUpdatedBy(currentUserId);
        } else {
            record = MilkRecord.builder()
                    .farm(farm)
                    .animal(animal)
                    .recordDate(date)
                    .shift(shift)
                    .litres(litres)
                    .quality(body.get("quality") != null ? body.get("quality").toString() : "Normal")
                    .notes(body.get("notes") != null ? body.get("notes").toString() : null)
                    .sourceType("MANUAL")
                    .createdBy(currentUserId)
                    .build();
        }

        MilkRecord saved = milkRecordRepository.save(record);

        // Update animal's lastMilkingDate and daily yield
        animal.setLastMilkingDate(Instant.now());
        animal.setMilkYield(litres);
        animalRepository.save(animal);

        return new ResponseEntity<>(Map.of("success", true, "data", MilkDto.fromEntity(saved)), HttpStatus.CREATED);
    }

    @PostMapping("/bulk")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'WORKER', 'ADMIN')")
    @Operation(summary = "Fast bulk group milking entry for mobile workflow")
    @SuppressWarnings("unchecked")
    public ResponseEntity<Map<String, Object>> recordBulkGroupMilk(@RequestBody Map<String, Object> body) {
        UUID farmId = getTenantFarmId();
        UUID currentUserId = TenantContext.getUserId();
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        LocalDate date = body.get("recordDate") != null ? LocalDate.parse(body.get("recordDate").toString()) : LocalDate.now();
        String shift = body.get("shift") != null ? body.get("shift").toString() : "Morning";

        List<Map<String, Object>> entries = (List<Map<String, Object>>) body.get("entries");
        if (entries == null || entries.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No milking entries provided"));
        }

        List<MilkDto> savedList = new ArrayList<>();
        BigDecimal bulkTotal = BigDecimal.ZERO;

        for (Map<String, Object> entry : entries) {
            Object rawIdent = entry.get("cowNumber");
            if (rawIdent == null) rawIdent = entry.get("animalNumber");
            if (rawIdent == null) rawIdent = entry.get("earTag");
            if (rawIdent == null) rawIdent = entry.get("tag");
            if (rawIdent == null) rawIdent = entry.get("animalId");
            if (rawIdent == null || entry.get("litres") == null) continue;

            Animal animal;
            try {
                animal = resolveAnimal(farmId, rawIdent.toString());
            } catch (BadRequestException e) {
                continue;
            }

            BigDecimal litres = new BigDecimal(entry.get("litres").toString());
            if (litres.compareTo(BigDecimal.ZERO) < 0) continue;
            UUID animalId = animal.getId();

            Optional<MilkRecord> existingOpt = milkRecordRepository.findByFarmIdAndAnimalIdAndRecordDateAndShift(farmId, animalId, date, shift);
            MilkRecord record;
            if (existingOpt.isPresent()) {
                record = existingOpt.get();
                record.setLitres(litres);
                if (entry.get("notes") != null) record.setNotes(entry.get("notes").toString());
                record.setUpdatedBy(currentUserId);
            } else {
                record = MilkRecord.builder()
                        .farm(farm)
                        .animal(animal)
                        .recordDate(date)
                        .shift(shift)
                        .litres(litres)
                        .quality(entry.get("quality") != null ? entry.get("quality").toString() : "Normal")
                        .notes(entry.get("notes") != null ? entry.get("notes").toString() : null)
                        .sourceType("MANUAL")
                        .createdBy(currentUserId)
                        .build();
            }

            MilkRecord saved = milkRecordRepository.save(record);
            bulkTotal = bulkTotal.add(litres);

            animal.setLastMilkingDate(Instant.now());
            animal.setMilkYield(litres);
            animalRepository.save(animal);

            savedList.add(MilkDto.fromEntity(saved));
        }

        return new ResponseEntity<>(Map.of(
                "success", true,
                "data", savedList,
                "recordedCount", savedList.size(),
                "totalLitres", bulkTotal,
                "message", "Successfully recorded " + savedList.size() + " milking entries (" + bulkTotal + " L total)"
        ), HttpStatus.CREATED);
    }
}
