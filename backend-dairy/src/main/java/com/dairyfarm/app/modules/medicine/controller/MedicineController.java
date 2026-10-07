package com.dairyfarm.app.modules.medicine.controller;

import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.exception.DuplicateResourceException;
import com.dairyfarm.app.common.exception.ResourceNotFoundException;
import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.animal.repository.AnimalRepository;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import com.dairyfarm.app.modules.medicine.dto.MedicineDto;
import com.dairyfarm.app.modules.medicine.model.Medicine;
import com.dairyfarm.app.modules.medicine.model.MedicineTransaction;
import com.dairyfarm.app.modules.medicine.repository.MedicineRepository;
import com.dairyfarm.app.modules.medicine.repository.MedicineTransactionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/medicine")
@RequiredArgsConstructor
@Tag(name = "Medicine Stock", description = "Endpoints for managing medicine inventory and clinical administration")
public class MedicineController {

    private final MedicineRepository medicineRepository;
    private final MedicineTransactionRepository transactionRepository;
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
    @Operation(summary = "Get medicine inventory with calculated balances")
    public ResponseEntity<Map<String, Object>> getMedicines(@RequestParam(required = false, defaultValue = "false") boolean all) {
        UUID farmId = getTenantFarmId();
        List<Medicine> medicines = all
                ? medicineRepository.findByFarmIdOrderByNameAsc(farmId)
                : medicineRepository.findByFarmIdAndActiveTrueOrderByNameAsc(farmId);

        List<MedicineTransaction> txs = transactionRepository.findByFarmIdOrderByTransactionDateDescCreatedAtDesc(farmId);

        Map<UUID, BigDecimal> receivedMap = new HashMap<>();
        Map<UUID, BigDecimal> usedMap = new HashMap<>();

        for (MedicineTransaction tx : txs) {
            UUID mId = tx.getMedicine().getId();
            BigDecimal q = tx.getQuantity() != null ? tx.getQuantity() : BigDecimal.ZERO;
            if ("RECEIVED".equalsIgnoreCase(tx.getTransactionType()) || "OPENING".equalsIgnoreCase(tx.getTransactionType())) {
                receivedMap.put(mId, receivedMap.getOrDefault(mId, BigDecimal.ZERO).add(q));
            } else {
                usedMap.put(mId, usedMap.getOrDefault(mId, BigDecimal.ZERO).add(q));
            }
        }

        List<MedicineDto> dtos = medicines.stream().map(m -> {
            BigDecimal rec = receivedMap.getOrDefault(m.getId(), BigDecimal.ZERO);
            BigDecimal usd = usedMap.getOrDefault(m.getId(), BigDecimal.ZERO);
            return MedicineDto.fromEntity(m, rec, usd);
        }).toList();

        return ResponseEntity.ok(Map.of("success", true, "data", dtos));
    }

    @PostMapping
    @Operation(summary = "Add a new medicine to inventory")
    public ResponseEntity<Map<String, Object>> createMedicine(@RequestBody Map<String, Object> body) {
        UUID farmId = getTenantFarmId();
        String name = body.get("name") != null ? body.get("name").toString().trim() : "";
        if (name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Medicine name is required"));
        }
        if (medicineRepository.existsByFarmIdAndName(farmId, name)) {
            throw new DuplicateResourceException("Medicine '" + name + "' already exists");
        }

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        Medicine med = Medicine.builder()
                .farm(farm)
                .name(name)
                .localName(body.get("localName") != null ? body.get("localName").toString().trim() : null)
                .unit(body.get("unit") != null ? body.get("unit").toString().trim() : "vial")
                .batchNumber(body.get("batchNumber") != null ? body.get("batchNumber").toString().trim() : null)
                .expiryDate(body.get("expiryDate") != null && !body.get("expiryDate").toString().isBlank() ? LocalDate.parse(body.get("expiryDate").toString()) : null)
                .minThreshold(body.get("minThreshold") != null ? new BigDecimal(body.get("minThreshold").toString()) : BigDecimal.ZERO)
                .notes(body.get("notes") != null ? body.get("notes").toString().trim() : null)
                .active(true)
                .build();

        Medicine saved = medicineRepository.save(med);

        // Optional initial stock
        if (body.get("initialStock") != null) {
            BigDecimal initQty = new BigDecimal(body.get("initialStock").toString());
            if (initQty.compareTo(BigDecimal.ZERO) > 0) {
                transactionRepository.save(MedicineTransaction.builder()
                        .farm(farm)
                        .medicine(saved)
                        .transactionType("RECEIVED")
                        .quantity(initQty)
                        .unit(saved.getUnit())
                        .transactionDate(LocalDate.now())
                        .reason("Initial batch stock")
                        .administeredBy("Farm Inventory")
                        .build());
            }
        }

        return new ResponseEntity<>(Map.of("success", true, "data", MedicineDto.fromEntity(saved, BigDecimal.ZERO, BigDecimal.ZERO)), HttpStatus.CREATED);
    }

    @PostMapping("/usage")
    @Operation(summary = "Record medicine usage/administration")
    public ResponseEntity<Map<String, Object>> recordUsage(@RequestBody Map<String, Object> body) {
        UUID farmId = getTenantFarmId();
        UUID medId = UUID.fromString(body.get("medicineId").toString());
        Medicine med = medicineRepository.findByIdAndFarmId(medId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", medId));

        BigDecimal qty = new BigDecimal(body.get("quantity").toString());
        Animal animal = null;
        if (body.get("animalId") != null && !body.get("animalId").toString().isBlank()) {
            UUID aId = UUID.fromString(body.get("animalId").toString());
            animal = animalRepository.findByIdAndFarmId(aId, farmId).orElse(null);
        }

        LocalDate date = body.get("transactionDate") != null ? LocalDate.parse(body.get("transactionDate").toString()) : LocalDate.now();

        MedicineTransaction tx = MedicineTransaction.builder()
                .farm(med.getFarm())
                .medicine(med)
                .transactionType("USAGE")
                .quantity(qty.abs())
                .unit(body.get("unit") != null ? body.get("unit").toString() : med.getUnit())
                .animal(animal)
                .administeredBy(body.get("administeredBy") != null ? body.get("administeredBy").toString() : "Farm Team")
                .reason(body.get("reason") != null ? body.get("reason").toString() : null)
                .transactionDate(date)
                .build();

        MedicineTransaction saved = transactionRepository.save(tx);
        return new ResponseEntity<>(Map.of("success", true, "data", saved), HttpStatus.CREATED);
    }

    @PostMapping("/receive")
    @Operation(summary = "Record medicine receipt / batch replenishment")
    public ResponseEntity<Map<String, Object>> recordReceipt(@RequestBody Map<String, Object> body) {
        UUID farmId = getTenantFarmId();
        UUID medId = UUID.fromString(body.get("medicineId").toString());
        Medicine med = medicineRepository.findByIdAndFarmId(medId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", medId));

        BigDecimal qty = new BigDecimal(body.get("quantity").toString());
        LocalDate date = body.get("transactionDate") != null ? LocalDate.parse(body.get("transactionDate").toString()) : LocalDate.now();

        MedicineTransaction tx = MedicineTransaction.builder()
                .farm(med.getFarm())
                .medicine(med)
                .transactionType("RECEIVED")
                .quantity(qty.abs())
                .unit(body.get("unit") != null ? body.get("unit").toString() : med.getUnit())
                .administeredBy(body.get("receivedBy") != null ? body.get("receivedBy").toString() : "Farm Team")
                .reason(body.get("reason") != null ? body.get("reason").toString() : "Stock Replenishment")
                .transactionDate(date)
                .build();

        MedicineTransaction saved = transactionRepository.save(tx);
        return new ResponseEntity<>(Map.of("success", true, "data", saved), HttpStatus.CREATED);
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get medicine transactions history")
    public ResponseEntity<Map<String, Object>> getTransactions(@RequestParam(required = false) UUID medicineId) {
        UUID farmId = getTenantFarmId();
        List<MedicineTransaction> list = medicineId != null
                ? transactionRepository.findByFarmIdAndMedicineIdOrderByTransactionDateDescCreatedAtDesc(farmId, medicineId)
                : transactionRepository.findByFarmIdOrderByTransactionDateDescCreatedAtDesc(farmId);

        return ResponseEntity.ok(Map.of("success", true, "data", list));
    }
}
