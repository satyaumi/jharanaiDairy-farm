package com.dairyfarm.app.modules.dataimport.service;

import com.dairyfarm.app.common.audit.AuditService;
import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.exception.BadRequestException;
import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.animal.model.AnimalStatus;
import com.dairyfarm.app.modules.animal.model.AnimalType;
import com.dairyfarm.app.modules.animal.repository.AnimalRepository;
import com.dairyfarm.app.modules.dataimport.dto.*;
import com.dairyfarm.app.modules.dataimport.model.ImportBatch;
import com.dairyfarm.app.modules.dataimport.repository.ImportBatchRepository;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import com.dairyfarm.app.modules.feed.model.FeedRecord;
import com.dairyfarm.app.modules.feed.repository.FeedRecordRepository;
import com.dairyfarm.app.modules.milk.model.MilkRecord;
import com.dairyfarm.app.modules.milk.repository.MilkRecordRepository;
import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImportEngineService {

    private final AnimalRepository animalRepository;
    private final MilkRecordRepository milkRecordRepository;
    private final FeedRecordRepository feedRecordRepository;
    private final ImportBatchRepository importBatchRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    // Supported formats
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("csv", "xlsx", "xls");

    /**
     * Step 1 - Analyze uploaded file: detect format, schema, column mappings, and validate rows against DB.
     */
    @Transactional(readOnly = true)
    public ImportAnalyzeResult analyzeFile(MultipartFile file) throws Exception {
        return analyzeFile(file, null);
    }

    @Transactional(readOnly = true)
    public ImportAnalyzeResult analyzeFile(MultipartFile file, String expectedType) throws Exception {
        return analyzeFile(file, expectedType, null);
    }

    @Transactional(readOnly = true)
    public ImportAnalyzeResult analyzeFile(MultipartFile file, String expectedType, UUID explicitFarmId) throws Exception {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        if (file.getSize() > 15 * 1024 * 1024) {
            throw new BadRequestException("File size exceeds 15MB limit. Please upload a smaller file.");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "records.csv";
        String ext = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BadRequestException("Unsupported file format: ." + ext + ". Please upload .csv, .xlsx, or .xls file.");
        }

        UUID farmId = explicitFarmId != null ? explicitFarmId : getTenantFarmId();

        // 1. Parse raw tabular data (Headers + Rows)
        ParsedTable table = ext.equals("csv") ? parseCsv(file.getInputStream()) : parseExcel(file.getInputStream());
        if (table.headers.isEmpty()) {
            throw new BadRequestException("File contains no valid header row.");
        }

        // 2. Deterministic Record Type Detection (or use expectedType if specified)
        String recordType;
        if (expectedType != null && !expectedType.isBlank() &&
                ("MILK_RECORD".equalsIgnoreCase(expectedType) || "COW_RECORD".equalsIgnoreCase(expectedType) || "FEED_RECORD".equalsIgnoreCase(expectedType))) {
            recordType = expectedType.toUpperCase();
        } else {
            recordType = detectRecordType(table.headers);
        }
        String recordTypeLabel = getRecordTypeLabel(recordType);

        // 3. Map Raw Headers to Canonical Fields
        Map<String, String> detectedMappings = detectColumnMappings(table.headers, recordType);
        List<ImportAnalyzeResult.FieldDefinition> availableFields = getAvailableFields(recordType);

        // 4. Preload Farm Animals for validation & lookup
        List<Animal> farmAnimals = animalRepository.findByFarmIdAndActiveTrue(farmId);
        Map<String, Animal> animalTagMap = farmAnimals.stream()
                .filter(a -> a.getEarTag() != null)
                .collect(Collectors.toMap(a -> a.getEarTag().trim().toUpperCase(), a -> a, (k1, k2) -> k1));

        // 5. Validate Rows & Match Existing Records for Upsert Preview
        List<ImportAnalyzeResult.PreviewRow> previewRows = new ArrayList<>();
        int validCount = 0;
        int warningCount = 0;
        int errorCount = 0;
        int conflictCount = 0;

        // Intra-file duplicate tracking sets
        Set<String> seenCowTagsInFile = new HashSet<>();
        Set<String> seenMilkKeysInFile = new HashSet<>();

        for (int i = 0; i < table.rows.size(); i++) {
            Map<String, String> rawRow = table.rows.get(i);
            int rowNum = i + 2; // 1-indexed, accounting for header line

            // Map raw row to canonical fields
            Map<String, Object> canonicalData = new HashMap<>();
            for (Map.Entry<String, String> entry : rawRow.entrySet()) {
                String targetField = detectedMappings.get(entry.getKey());
                if (targetField != null && !targetField.isBlank()) {
                    canonicalData.put(targetField, entry.getValue().trim());
                }
            }

            List<String> errors = new ArrayList<>();
            List<String> warnings = new ArrayList<>();
            Map<String, Object> existingData = null;
            String action = "CREATE";

            if ("MILK_RECORD".equals(recordType)) {
                String cowTag = getString(canonicalData, "cow_tag");
                String dateStr = getString(canonicalData, "record_date");
                String shift = getString(canonicalData, "shift");
                String morningMilkStr = getString(canonicalData, "morning_milk");
                String eveningMilkStr = getString(canonicalData, "evening_milk");
                String litresStr = getString(canonicalData, "litres");

                if (cowTag == null || cowTag.isBlank()) {
                    errors.add("Cow ID/Tag is required");
                } else if (!animalTagMap.containsKey(cowTag.toUpperCase())) {
                    errors.add(String.format("Cow '%s' not found in Jharanai herd", cowTag));
                }

                LocalDate recDate = parseDate(dateStr);
                if (recDate == null) {
                    errors.add("Invalid or missing record date (expected YYYY-MM-DD, DD-MM-YYYY)");
                }

                String effectiveShift = (shift != null && !shift.isBlank()) ? shift : (morningMilkStr != null ? "Morning" : "Evening");

                // Intra-file duplicate check for milk records
                if (cowTag != null && recDate != null) {
                    String milkKey = cowTag.toUpperCase() + "_" + recDate + "_" + effectiveShift.toLowerCase();
                    if (!seenMilkKeysInFile.add(milkKey)) {
                        warnings.add(String.format("Duplicate entry for Cow '%s' on %s (%s) within uploaded file", cowTag, recDate, effectiveShift));
                    }
                }

                // If specific shift and litres or morning/evening columns
                Animal matchedAnimal = cowTag != null ? animalTagMap.get(cowTag.toUpperCase()) : null;
                if (matchedAnimal != null && recDate != null) {
                    Optional<MilkRecord> existingOpt = milkRecordRepository.findByFarmIdAndAnimalIdAndRecordDateAndShift(
                            farmId, matchedAnimal.getId(), recDate, effectiveShift);

                    if (existingOpt.isPresent()) {
                        MilkRecord existing = existingOpt.get();
                        action = "UPDATE";
                        conflictCount++;
                        existingData = Map.of(
                                "litres", existing.getLitres(),
                                "shift", existing.getShift(),
                                "date", existing.getRecordDate(),
                                "quality", existing.getQuality() != null ? existing.getQuality() : "Normal"
                        );
                    }
                }

                // Validate Litres values
                validateNumeric(litresStr, "Litres", false, errors);
                validateNumeric(morningMilkStr, "Morning Milk", false, errors);
                validateNumeric(eveningMilkStr, "Evening Milk", false, errors);

                // Range validation for litres
                if (litresStr != null && !litresStr.isBlank()) {
                    try {
                        double l = Double.parseDouble(litresStr.trim());
                        if (l > 60.0) errors.add(String.format("Quantity %.1f L exceeds realistic single-session limit (60 L)", l));
                    } catch (NumberFormatException ignored) {}
                }

            } else if ("COW_RECORD".equals(recordType)) {
                String cowTag = getString(canonicalData, "cow_tag");
                if (cowTag == null || cowTag.isBlank()) {
                    errors.add("Cow Tag/Ear Tag is mandatory");
                } else {
                    String cleanTag = cowTag.trim().toUpperCase();
                    // Reject intra-file duplicate Cow Numbers
                    if (!seenCowTagsInFile.add(cleanTag)) {
                        errors.add(String.format("Duplicate Cow Number '%s' in uploaded spreadsheet (row %d)", cowTag, rowNum));
                    }

                    if (animalTagMap.containsKey(cleanTag)) {
                        action = "UPDATE";
                        conflictCount++;
                        Animal existingCow = animalTagMap.get(cleanTag);
                        existingData = Map.of(
                                "name", existingCow.getAnimalName() != null ? existingCow.getAnimalName() : "",
                                "breed", existingCow.getBreed() != null ? existingCow.getBreed() : "",
                                "weight", existingCow.getWeight() != null ? existingCow.getWeight() : BigDecimal.ZERO,
                                "yield", existingCow.getMilkYield() != null ? existingCow.getMilkYield() : BigDecimal.ZERO,
                                "status", existingCow.getStatus() != null ? existingCow.getStatus() : "Healthy"
                        );
                    }
                }

                String weightStr = getString(canonicalData, "weight");
                validateNumeric(weightStr, "Weight", false, errors);
                if (weightStr != null && !weightStr.isBlank()) {
                    try {
                        double w = Double.parseDouble(weightStr.trim());
                        if (w > 1500) errors.add("Weight exceeds biological maximum (1500 kg)");
                    } catch (NumberFormatException ignored) {}
                }

                String yieldStr = getString(canonicalData, "yield");
                validateNumeric(yieldStr, "Daily Yield", false, errors);
                if (yieldStr != null && !yieldStr.isBlank()) {
                    try {
                        double y = Double.parseDouble(yieldStr.trim());
                        if (y > 60.0) errors.add("Expected yield exceeds maximum capacity (60 L)");
                    } catch (NumberFormatException ignored) {}
                }

                String birthDateStr = getString(canonicalData, "birth_date");
                if (birthDateStr != null && !birthDateStr.isBlank()) {
                    LocalDate bDate = parseDate(birthDateStr);
                    if (bDate == null) {
                        warnings.add("Unrecognized birth date format");
                    } else if (bDate.isAfter(LocalDate.now())) {
                        errors.add("Birth date cannot be in the future");
                    }
                }

            } else if ("FEED_RECORD".equals(recordType)) {
                String feedType = getString(canonicalData, "feed_type");
                String qtyStr = getString(canonicalData, "quantity_kg");
                String dateStr = getString(canonicalData, "record_date");

                if (feedType == null || feedType.isBlank()) {
                    errors.add("Feed Type is required");
                }
                if (parseDate(dateStr) == null) {
                    errors.add("Valid record date required");
                }
                validateNumeric(qtyStr, "Quantity (kg)", true, errors);
            }

            String rowStatus = "VALID";
            if (!errors.isEmpty()) {
                rowStatus = "ERROR";
                action = "ERROR";
                errorCount++;
            } else if (!warnings.isEmpty()) {
                rowStatus = "WARNING";
                warningCount++;
            } else {
                validCount++;
            }

            previewRows.add(ImportAnalyzeResult.PreviewRow.builder()
                    .rowNumber(rowNum)
                    .status(rowStatus)
                    .action(action)
                    .data(canonicalData)
                    .existingData(existingData)
                    .warnings(warnings)
                    .errors(errors)
                    .build());
        }

        return ImportAnalyzeResult.builder()
                .fileName(originalFilename)
                .recordType(recordType)
                .recordTypeLabel(recordTypeLabel)
                .confidence(0.95)
                .totalRows(table.rows.size())
                .validCount(validCount)
                .warningCount(warningCount)
                .errorCount(errorCount)
                .conflictCount(conflictCount)
                .rawHeaders(table.headers)
                .detectedMappings(detectedMappings)
                .availableFields(availableFields)
                .previewRows(previewRows)
                .build();
    }

    /**
     * Step 2 - Execute atomic transactional Upsert and record batch audit history.
     */
    @Transactional
    public ImportConfirmResult confirmImport(ImportConfirmRequest request, UUID userId, String userName) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        UUID farmId = (user != null && user.getFarm() != null)
                ? user.getFarm().getId()
                : getTenantFarmId();
        Farm farm = (user != null && user.getFarm() != null)
                ? user.getFarm()
                : farmRepository.findById(farmId)
                        .orElseThrow(() -> new BadRequestException("Farm not found: " + farmId));

        String dupPolicy = request.getDuplicatePolicy() != null ? request.getDuplicatePolicy().trim().toUpperCase() : "UPDATE";

        String batchCode = String.format("IMPORT-%s-%04d",
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                new Random().nextInt(9000) + 1000);

        ImportBatch batch = ImportBatch.builder()
                .farm(farm)
                .batchCode(batchCode)
                .fileName(request.getFileName() != null ? request.getFileName() : "records_import")
                .recordType(request.getRecordType())
                .totalRows(request.getRows().size())
                .importedBy(user)
                .importedByName(userName != null ? userName : "Farm User")
                .status("PROCESSING")
                .build();
        batch = importBatchRepository.save(batch);

        int created = 0;
        int updated = 0;
        int skipped = 0;
        int errors = 0;
        List<Map<String, Object>> errorDetails = new ArrayList<>();

        // Preload animals
        List<Animal> farmAnimals = animalRepository.findByFarmIdAndActiveTrue(farmId);
        Map<String, Animal> animalMap = farmAnimals.stream()
                .filter(a -> a.getEarTag() != null)
                .collect(Collectors.toMap(a -> a.getEarTag().trim().toUpperCase(), a -> a, (k1, k2) -> k1));

        for (int i = 0; i < request.getRows().size(); i++) {
            Map<String, String> row = request.getRows().get(i);
            int rowNum = i + 2;

            try {
                if ("MILK_RECORD".equalsIgnoreCase(request.getRecordType())) {
                    String cowTag = row.get("cow_tag");
                    String dateStr = row.get("record_date");
                    String shift = row.get("shift");
                    String litresStr = row.get("litres");
                    String morningLitres = row.get("morning_milk");
                    String eveningLitres = row.get("evening_milk");

                    if (cowTag == null || !animalMap.containsKey(cowTag.trim().toUpperCase())) {
                        errors++;
                        errorDetails.add(Map.of("row", rowNum, "field", "cow_tag", "error", "Cow tag not found"));
                        continue;
                    }
                    Animal animal = animalMap.get(cowTag.trim().toUpperCase());
                    LocalDate date = parseDate(dateStr);
                    if (date == null) date = LocalDate.now();

                    // Handle single shift or AM/PM split
                    if (morningLitres != null && !morningLitres.isBlank()) {
                        BigDecimal amLit = new BigDecimal(morningLitres);
                        UpsertOutcome outcome = upsertMilkRecord(farm, animal, date, "Morning", amLit, batch.getId(), userId, dupPolicy);
                        if (outcome == UpsertOutcome.CREATED) created++;
                        else if (outcome == UpsertOutcome.UPDATED) updated++;
                        else skipped++;
                    }
                    if (eveningLitres != null && !eveningLitres.isBlank()) {
                        BigDecimal pmLit = new BigDecimal(eveningLitres);
                        UpsertOutcome outcome = upsertMilkRecord(farm, animal, date, "Evening", pmLit, batch.getId(), userId, dupPolicy);
                        if (outcome == UpsertOutcome.CREATED) created++;
                        else if (outcome == UpsertOutcome.UPDATED) updated++;
                        else skipped++;
                    }
                    if ((morningLitres == null || morningLitres.isBlank()) && (eveningLitres == null || eveningLitres.isBlank())) {
                        String s = (shift != null && !shift.isBlank()) ? shift : "Morning";
                        BigDecimal lit = litresStr != null && !litresStr.isBlank() ? new BigDecimal(litresStr) : BigDecimal.ZERO;
                        UpsertOutcome outcome = upsertMilkRecord(farm, animal, date, s, lit, batch.getId(), userId, dupPolicy);
                        if (outcome == UpsertOutcome.CREATED) created++;
                        else if (outcome == UpsertOutcome.UPDATED) updated++;
                        else skipped++;
                    }

                    // Synchronize animal's last milking date and yield
                    animal.setLastMilkingDate(java.time.Instant.now());
                    animalRepository.save(animal);

                } else if ("COW_RECORD".equalsIgnoreCase(request.getRecordType())) {
                    String cowTag = row.get("cow_tag");
                    String name = row.get("cow_name");
                    String breed = row.get("breed");
                    String type = row.get("type");
                    String status = row.get("status");
                    String weightStr = row.get("weight");
                    String yieldStr = row.get("yield");
                    String pen = row.get("pen");
                    String age = row.get("age");
                    String lactationCycleStr = row.get("lactation_cycle");
                    String fatherTag = row.get("father_tag");
                    String motherTag = row.get("mother_tag");
                    String birthDateStr = row.get("birth_date");
                    String aiDateStr = row.get("ai_date");
                    String lastVaccinationDateStr = row.get("last_vaccination_date");

                    if (cowTag == null || cowTag.isBlank()) {
                        errors++;
                        errorDetails.add(Map.of("row", rowNum, "field", "cow_tag", "error", "Cow tag is mandatory"));
                        continue;
                    }

                    String cleanTag = cowTag.trim().toUpperCase();

                    if (animalMap.containsKey(cleanTag)) {
                        if ("SKIP".equals(dupPolicy)) {
                            skipped++;
                            continue;
                        }

                        // Update existing cow
                        Animal existing = animalMap.get(cleanTag);
                        if (name != null && !name.isBlank()) existing.setAnimalName(name);
                        if (breed != null && !breed.isBlank()) existing.setBreed(breed);
                        if (pen != null && !pen.isBlank()) existing.setPen(pen);
                        if (type != null && !type.isBlank()) existing.setAnimalType(parseAnimalType(type));
                        if (status != null && !status.isBlank()) existing.setStatus(status);
                        if (weightStr != null && !weightStr.isBlank()) existing.setWeight(new BigDecimal(weightStr));
                        if (yieldStr != null && !yieldStr.isBlank()) existing.setMilkYield(new BigDecimal(yieldStr));
                        if (age != null && !age.isBlank()) existing.setAge(age);
                        if (lactationCycleStr != null && !lactationCycleStr.isBlank()) {
                            try { existing.setLactationCycle(Integer.parseInt(lactationCycleStr.trim())); } catch (Exception ignored) {}
                        }
                        if (fatherTag != null && !fatherTag.isBlank()) existing.setFatherTag(fatherTag);
                        if (motherTag != null && !motherTag.isBlank()) existing.setMotherTag(motherTag);
                        if (birthDateStr != null && !birthDateStr.isBlank()) {
                            LocalDate bd = parseDate(birthDateStr);
                            if (bd != null) existing.setBirthDate(bd);
                        }
                        if (aiDateStr != null && !aiDateStr.isBlank()) {
                            LocalDate ad = parseDate(aiDateStr);
                            if (ad != null) existing.setAiDate(ad);
                        }
                        if (lastVaccinationDateStr != null && !lastVaccinationDateStr.isBlank()) {
                            LocalDate vd = parseDate(lastVaccinationDateStr);
                            if (vd != null) existing.setLastVaccinationDate(vd);
                        }

                        animalRepository.save(existing);
                        updated++;
                        auditService.record("IMPORT_UPDATE_COW", "Animal", existing.getId().toString(),
                                "Updated cow " + cowTag + " from batch " + batchCode);
                    } else {
                        // Create new cow
                        Animal.AnimalBuilder builder = Animal.builder()
                                .farm(farm)
                                .earTag(cleanTag)
                                .animalName(name != null && !name.isBlank() ? name : "Cow-" + cowTag)
                                .breed(breed != null && !breed.isBlank() ? breed : "Holstein")
                                .animalType(type != null && !type.isBlank() ? parseAnimalType(type) : AnimalType.Lactating)
                                .status(status != null && !status.isBlank() ? status : "Healthy")
                                .weight(weightStr != null && !weightStr.isBlank() ? new BigDecimal(weightStr) : BigDecimal.valueOf(450))
                                .milkYield(yieldStr != null && !yieldStr.isBlank() ? new BigDecimal(yieldStr) : BigDecimal.ZERO)
                                .pen(pen != null && !pen.isBlank() ? pen : "Barn A")
                                .active(true);

                        if (age != null && !age.isBlank()) builder.age(age);
                        if (lactationCycleStr != null && !lactationCycleStr.isBlank()) {
                            try { builder.lactationCycle(Integer.parseInt(lactationCycleStr.trim())); } catch (Exception ignored) {}
                        }
                        if (fatherTag != null && !fatherTag.isBlank()) builder.fatherTag(fatherTag);
                        if (motherTag != null && !motherTag.isBlank()) builder.motherTag(motherTag);
                        if (birthDateStr != null && !birthDateStr.isBlank()) {
                            LocalDate bd = parseDate(birthDateStr);
                            if (bd != null) builder.birthDate(bd);
                        }
                        if (aiDateStr != null && !aiDateStr.isBlank()) {
                            LocalDate ad = parseDate(aiDateStr);
                            if (ad != null) builder.aiDate(ad);
                        }
                        if (lastVaccinationDateStr != null && !lastVaccinationDateStr.isBlank()) {
                            LocalDate vd = parseDate(lastVaccinationDateStr);
                            if (vd != null) builder.lastVaccinationDate(vd);
                        }

                        Animal saved = animalRepository.save(builder.build());
                        animalMap.put(saved.getEarTag().toUpperCase(), saved);
                        created++;
                        auditService.record("IMPORT_CREATE_COW", "Animal", saved.getId().toString(),
                                "Created cow " + cowTag + " from batch " + batchCode);
                    }

                } else if ("FEED_RECORD".equalsIgnoreCase(request.getRecordType())) {
                    String feedType = row.get("feed_type");
                    String group = row.get("group_name");
                    String qtyStr = row.get("quantity_kg");
                    String dateStr = row.get("record_date");

                    LocalDate date = parseDate(dateStr);
                    if (date == null) date = LocalDate.now();

                    FeedRecord feed = FeedRecord.builder()
                            .farm(farm)
                            .feedType(feedType != null && !feedType.isBlank() ? feedType : "Green fodder")
                            .groupName(group != null && !group.isBlank() ? group : "Milking herd")
                            .quantityKg(qtyStr != null && !qtyStr.isBlank() ? new BigDecimal(qtyStr) : BigDecimal.ZERO)
                            .recordDate(date)
                            .recordedBy(userName)
                            .sourceType("IMPORT")
                            .importBatchId(batch.getId())
                            .build();
                    feedRecordRepository.save(feed);
                    created++;
                }

            } catch (Exception ex) {
                log.error("Failed importing row {}: {}", rowNum, ex.getMessage());
                errors++;
                errorDetails.add(Map.of("row", rowNum, "error", ex.getMessage()));
            }
        }

        batch.setCreatedCount(created);
        batch.setUpdatedCount(updated);
        batch.setSkippedCount(skipped);
        batch.setErrorCount(errors);
        batch.setStatus(errors == 0 ? "COMPLETED" : (created + updated > 0 ? "COMPLETED_WITH_WARNINGS" : "FAILED"));
        if (!errorDetails.isEmpty()) {
            batch.setErrorLog(errorDetails.toString());
        }
        importBatchRepository.save(batch);

        auditService.record("IMPORT_BATCH_COMPLETED", "ImportBatch", batch.getId().toString(),
                String.format("Batch %s: created=%d, updated=%d, skipped=%d, errors=%d", batchCode, created, updated, skipped, errors));

        return ImportConfirmResult.builder()
                .batchCode(batchCode)
                .fileName(batch.getFileName())
                .recordType(batch.getRecordType())
                .totalRows(request.getRows().size())
                .createdCount(created)
                .updatedCount(updated)
                .skippedCount(skipped)
                .errorCount(errors)
                .status(batch.getStatus())
                .message(String.format("Successfully synchronized %d records (%d created, %d updated, %d skipped).",
                        created + updated, created, updated, skipped))
                .errorDetails(errorDetails)
                .build();
    }

    private enum UpsertOutcome { CREATED, UPDATED, SKIPPED }

    private UpsertOutcome upsertMilkRecord(Farm farm, Animal animal, LocalDate date, String shift,
                                          BigDecimal litres, UUID batchId, UUID userId, String dupPolicy) {
        Optional<MilkRecord> existingOpt = milkRecordRepository.findByFarmIdAndAnimalIdAndRecordDateAndShift(
                farm.getId(), animal.getId(), date, shift);

        if (existingOpt.isPresent()) {
            if ("SKIP".equals(dupPolicy)) {
                return UpsertOutcome.SKIPPED;
            }
            MilkRecord existing = existingOpt.get();
            BigDecimal oldLitres = existing.getLitres();
            existing.setLitres(litres);
            existing.setSourceType("IMPORT");
            existing.setImportBatchId(batchId);
            existing.setUpdatedBy(userId);
            milkRecordRepository.save(existing);

            auditService.record("IMPORT_UPDATE_MILK", "MilkRecord", existing.getId().toString(),
                    String.format("Updated milk for Cow %s on %s %s: %s L -> %s L",
                            animal.getEarTag(), date, shift, oldLitres, litres));
            return UpsertOutcome.UPDATED;
        } else {
            MilkRecord newRec = MilkRecord.builder()
                    .farm(farm)
                    .animal(animal)
                    .recordDate(date)
                    .shift(shift)
                    .litres(litres)
                    .quality("Normal")
                    .sourceType("IMPORT")
                    .importBatchId(batchId)
                    .createdBy(userId)
                    .build();
            MilkRecord saved = milkRecordRepository.save(newRec);

            auditService.record("IMPORT_CREATE_MILK", "MilkRecord", saved.getId().toString(),
                    String.format("Recorded milk for Cow %s on %s %s: %s L",
                            animal.getEarTag(), date, shift, litres));
            return UpsertOutcome.CREATED;
        }
    }

    // ==========================================
    // HELPERS & FILE PARSERS
    // ==========================================

    private static class ParsedTable {
        List<String> headers = new ArrayList<>();
        List<Map<String, String>> rows = new ArrayList<>();
    }

    private ParsedTable parseCsv(InputStream in) throws Exception {
        ParsedTable table = new ParsedTable();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line = reader.readLine();
            if (line == null) return table;

            // Strip UTF-8 BOM if present
            if (line.startsWith("\uFEFF")) {
                line = line.substring(1);
            }

            List<String> rawHeaders = parseCsvLine(line);
            table.headers = rawHeaders.stream().map(String::trim).collect(Collectors.toList());

            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                List<String> cells = parseCsvLine(line);
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < table.headers.size(); i++) {
                    String val = i < cells.size() ? cells.get(i).trim() : "";
                    row.put(table.headers.get(i), val);
                }
                table.rows.add(row);
            }
        }
        return table;
    }

    private List<String> parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '\"') {
                    cur.append('\"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                tokens.add(cur.toString());
                cur.setLength(0);
            } else {
                cur.append(c);
            }
        }
        tokens.add(cur.toString());
        return tokens;
    }

    private ParsedTable parseExcel(InputStream in) throws Exception {
        ParsedTable table = new ParsedTable();
        try (Workbook workbook = WorkbookFactory.create(in)) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) return table;

            for (Cell cell : headerRow) {
                table.headers.add(formatter.formatCellValue(cell).trim());
            }

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                Map<String, String> rowMap = new LinkedHashMap<>();
                boolean hasContent = false;
                for (int c = 0; c < table.headers.size(); c++) {
                    Cell cell = row.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    String val = cell != null ? formatter.formatCellValue(cell).trim() : "";
                    if (!val.isEmpty()) hasContent = true;
                    rowMap.put(table.headers.get(c), val);
                }
                if (hasContent) {
                    table.rows.add(rowMap);
                }
            }
        }
        return table;
    }

    private String detectRecordType(List<String> headers) {
        Set<String> hSet = headers.stream().map(h -> h.toLowerCase().trim()).collect(Collectors.toSet());

        boolean hasCow = hSet.stream().anyMatch(h -> h.contains("cow") || h.contains("tag") || h.contains("animal") || h.contains("cattle"));
        boolean hasMilk = hSet.stream().anyMatch(h -> h.contains("milk") || h.contains("morning") || h.contains("evening") || h.contains("litres") || h.contains("yield") || h.contains("session") || h.contains("shift"));
        boolean hasFeed = hSet.stream().anyMatch(h -> h.contains("feed") || h.contains("fodder") || h.contains("ration") || h.contains("concentrate"));
        boolean hasCowBio = hSet.stream().anyMatch(h -> h.contains("breed") || h.contains("weight") || h.contains("lactation") || h.contains("pen") || h.contains("birth"));

        if (hasMilk && hasCow) {
            return "MILK_RECORD";
        }
        if (hasFeed) {
            return "FEED_RECORD";
        }
        if (hasCowBio || (hasCow && !hasMilk)) {
            return "COW_RECORD";
        }
        return "MILK_RECORD"; // Default
    }

    private String getRecordTypeLabel(String type) {
        switch (type) {
            case "MILK_RECORD": return "Milk Production Records";
            case "COW_RECORD": return "Cattle / Herd Inventory";
            case "FEED_RECORD": return "Feed & Fodder Consumption";
            default: return "Farm Records";
        }
    }

    private Map<String, String> detectColumnMappings(List<String> headers, String recordType) {
        Map<String, String> mappings = new LinkedHashMap<>();

        for (String raw : headers) {
            String norm = raw.toLowerCase().replaceAll("[^a-z0-9]", "");
            String target = null;

            if (norm.contains("cow") || norm.contains("tag") || norm.contains("cattle") || norm.contains("animalid")) {
                if (norm.contains("sire") || norm.contains("father")) target = "father_tag";
                else if (norm.contains("dam") || norm.contains("mother")) target = "mother_tag";
                else if (norm.contains("name")) target = "cow_name";
                else target = "cow_tag";
            } else if (norm.contains("birth") || norm.contains("dob")) {
                target = "birth_date";
            } else if (norm.contains("date") || norm.contains("day")) {
                target = "record_date";
            } else if (norm.contains("status") || norm.contains("health")) {
                target = "status";
            } else if (norm.contains("lactation")) {
                target = "lactation_cycle";
            } else if (norm.contains("age")) {
                target = "age";
            } else if (norm.contains("sire") || norm.contains("father")) {
                target = "father_tag";
            } else if (norm.contains("dam") || norm.contains("mother")) {
                target = "mother_tag";
            } else if (norm.contains("ai") || norm.contains("insemination")) {
                target = "ai_date";
            } else if (norm.contains("vaccin")) {
                target = "last_vaccination_date";
            } else if (norm.contains("morning") || norm.equals("am") || norm.contains("ammilk")) {
                target = "morning_milk";
            } else if (norm.contains("evening") || norm.equals("pm") || norm.contains("pmmilk")) {
                target = "evening_milk";
            } else if (norm.contains("shift") || norm.contains("session")) {
                target = "shift";
            } else if (norm.contains("litres") || norm.contains("liters") || norm.contains("milk") || norm.contains("yield") || norm.contains("qty")) {
                target = "litres";
            } else if (norm.contains("breed")) {
                target = "breed";
            } else if (norm.contains("weight")) {
                target = "weight";
            } else if (norm.contains("pen") || norm.contains("shed")) {
                target = "pen";
            } else if (norm.contains("type") || norm.contains("category")) {
                target = "type";
            } else if (norm.contains("feed") || norm.contains("fodder")) {
                target = "feed_type";
            } else if (norm.contains("group")) {
                target = "group_name";
            } else if (norm.contains("kg") || norm.contains("amount")) {
                target = "quantity_kg";
            }

            mappings.put(raw, target);
        }
        return mappings;
    }

    private List<ImportAnalyzeResult.FieldDefinition> getAvailableFields(String recordType) {
        if ("MILK_RECORD".equals(recordType)) {
            return List.of(
                    new ImportAnalyzeResult.FieldDefinition("cow_tag", "Cow ID / Ear Tag", true, "COW-001", "Unique Ear Tag identifying the cow"),
                    new ImportAnalyzeResult.FieldDefinition("record_date", "Record Date", true, "2026-10-03", "Date of milking"),
                    new ImportAnalyzeResult.FieldDefinition("shift", "Shift / Session", false, "Morning", "Morning, Evening, Afternoon"),
                    new ImportAnalyzeResult.FieldDefinition("litres", "Total Litres", false, "12.5", "Litres produced"),
                    new ImportAnalyzeResult.FieldDefinition("morning_milk", "Morning Milk (L)", false, "12.5", "AM session litres"),
                    new ImportAnalyzeResult.FieldDefinition("evening_milk", "Evening Milk (L)", false, "11.0", "PM session litres")
            );
        } else if ("COW_RECORD".equals(recordType)) {
            return List.of(
                    new ImportAnalyzeResult.FieldDefinition("cow_tag", "Ear Tag / Cow Number", true, "COW-101", "Unique Ear Tag identifying the cow"),
                    new ImportAnalyzeResult.FieldDefinition("cow_name", "Animal Name", false, "Lakshmi", "Name or identifier"),
                    new ImportAnalyzeResult.FieldDefinition("breed", "Breed", false, "Sahiwal", "Cattle breed"),
                    new ImportAnalyzeResult.FieldDefinition("type", "Type / Life Stage", false, "Lactating", "Lactating, Pregnant, Calf, Dry"),
                    new ImportAnalyzeResult.FieldDefinition("status", "Health Status", false, "Healthy", "Healthy, Sick, Needs check, etc."),
                    new ImportAnalyzeResult.FieldDefinition("weight", "Weight (kg)", false, "480", "Animal weight in kg"),
                    new ImportAnalyzeResult.FieldDefinition("yield", "Daily Yield (L)", false, "22.5", "Expected daily milk yield"),
                    new ImportAnalyzeResult.FieldDefinition("pen", "Pen / Shed", false, "Barn A", "Living enclosure"),
                    new ImportAnalyzeResult.FieldDefinition("birth_date", "Birth Date", false, "2022-04-10", "Date of birth (YYYY-MM-DD)"),
                    new ImportAnalyzeResult.FieldDefinition("lactation_cycle", "Lactation Cycle", false, "2", "Number of completed lactations"),
                    new ImportAnalyzeResult.FieldDefinition("age", "Age", false, "3y 6m", "Approximate age"),
                    new ImportAnalyzeResult.FieldDefinition("father_tag", "Sire / Father Tag", false, "SIRE-01", "Father Ear Tag"),
                    new ImportAnalyzeResult.FieldDefinition("mother_tag", "Dam / Mother Tag", false, "DAM-01", "Mother Ear Tag"),
                    new ImportAnalyzeResult.FieldDefinition("ai_date", "AI Insemination Date", false, "2024-03-10", "Date of Artificial Insemination"),
                    new ImportAnalyzeResult.FieldDefinition("last_vaccination_date", "Last Vaccination Date", false, "2024-07-01", "Date of last vaccination")
            );
        } else {
            return List.of(
                    new ImportAnalyzeResult.FieldDefinition("feed_type", "Feed Type", true, "Green fodder", "Name of feed/ration"),
                    new ImportAnalyzeResult.FieldDefinition("quantity_kg", "Quantity (kg)", true, "350", "Amount fed in kg"),
                    new ImportAnalyzeResult.FieldDefinition("record_date", "Date", true, "2026-10-03", "Feeding date"),
                    new ImportAnalyzeResult.FieldDefinition("group_name", "Target Group", false, "Milking herd", "Target herd group")
            );
        }
    }

    public byte[] generateTemplate(String recordType, String format) throws Exception {
        boolean isXlsx = "xlsx".equalsIgnoreCase(format);
        boolean isCow = "COW_RECORD".equalsIgnoreCase(recordType) || "cow".equalsIgnoreCase(recordType) || "cows".equalsIgnoreCase(recordType) || "cattle".equalsIgnoreCase(recordType);

        if (isXlsx) {
            try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet(isCow ? "Cattle Herd Template" : "Milk Harvest Template");
                CellStyle headerStyle = workbook.createCellStyle();
                Font hFont = workbook.createFont();
                hFont.setBold(true);
                hFont.setColor(IndexedColors.WHITE.getIndex());
                headerStyle.setFont(hFont);
                headerStyle.setFillForegroundColor(IndexedColors.GREEN.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

                String[] headers = isCow
                        ? new String[]{"Cow Tag", "Animal Name", "Breed", "Type", "Status", "Weight (kg)", "Daily Yield (L)", "Pen", "Birth Date", "Lactation Cycle", "Sire Tag", "Dam Tag"}
                        : new String[]{"Cow Tag", "Record Date", "Session", "Litres", "Morning Milk", "Evening Milk", "Notes"};

                Row hRow = sheet.createRow(0);
                for (int i = 0; i < headers.length; i++) {
                    Cell c = hRow.createCell(i);
                    c.setCellValue(headers[i]);
                    c.setCellStyle(headerStyle);
                }

                String[][] samples = isCow
                        ? new String[][]{
                            {"COW-101", "Lakshmi", "Sahiwal", "Lactating", "Healthy", "460", "18.5", "Barn A", "2022-04-10", "2", "SIRE-01", "DAM-01"},
                            {"COW-102", "Radha", "Gir", "Pregnant", "Healthy", "490", "15.0", "Barn B", "2021-08-15", "3", "SIRE-02", "DAM-02"},
                            {"COW-103", "Gauri", "Holstein", "Calf", "Healthy", "120", "0.0", "Nursery", "2024-02-01", "0", "", ""}
                        }
                        : new String[][]{
                            {"COW-101", LocalDate.now().toString(), "Morning", "12.5", "", "", "Normal harvest"},
                            {"COW-101", LocalDate.now().toString(), "Evening", "11.0", "", "", "Normal harvest"},
                            {"COW-102", LocalDate.now().toString(), "Morning", "14.0", "", "", "High yield"}
                        };

                for (int r = 0; r < samples.length; r++) {
                    Row row = sheet.createRow(r + 1);
                    for (int c = 0; c < samples[r].length; c++) {
                        row.createCell(c).setCellValue(samples[r][c]);
                    }
                }

                for (int i = 0; i < headers.length; i++) {
                    sheet.autoSizeColumn(i);
                }

                workbook.write(baos);
                return baos.toByteArray();
            }
        } else {
            // CSV
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
                if (isCow) {
                    writer.println("Cow Tag,Animal Name,Breed,Type,Status,Weight (kg),Daily Yield (L),Pen,Birth Date,Lactation Cycle,Sire Tag,Dam Tag");
                    writer.println("COW-101,Lakshmi,Sahiwal,Lactating,Healthy,460,18.5,Barn A,2022-04-10,2,SIRE-01,DAM-01");
                    writer.println("COW-102,Radha,Gir,Pregnant,Healthy,490,15.0,Barn B,2021-08-15,3,SIRE-02,DAM-02");
                    writer.println("COW-103,Gauri,Holstein,Calf,Healthy,120,0.0,Nursery,2024-02-01,0,,");
                } else {
                    writer.println("Cow Tag,Record Date,Session,Litres,Morning Milk,Evening Milk,Notes");
                    writer.println("COW-101," + LocalDate.now() + ",Morning,12.5,,,Normal harvest");
                    writer.println("COW-101," + LocalDate.now() + ",Evening,11.0,,,Normal harvest");
                    writer.println("COW-102," + LocalDate.now() + ",Morning,14.0,,,High yield");
                }
                writer.flush();
            }
            return baos.toByteArray();
        }
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        dateStr = dateStr.trim();
        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                DateTimeFormatter.ofPattern("yyyy/MM/dd"),
                DateTimeFormatter.ofPattern("d-M-yyyy"),
                DateTimeFormatter.ofPattern("d/M/yyyy")
        );
        for (DateTimeFormatter f : formatters) {
            try {
                return LocalDate.parse(dateStr, f);
            } catch (Exception ignored) {}
        }
        return null;
    }

    private void validateNumeric(String val, String label, boolean required, List<String> errors) {
        if (val == null || val.isBlank()) {
            if (required) errors.add(label + " is required");
            return;
        }
        try {
            double d = Double.parseDouble(val.trim());
            if (d < 0) {
                errors.add(label + " cannot be negative (" + val + ")");
            }
        } catch (NumberFormatException e) {
            errors.add(label + " must be a valid number (" + val + ")");
        }
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString().trim() : null;
    }

    private AnimalType parseAnimalType(String typeStr) {
        for (AnimalType type : AnimalType.values()) {
            if (type.name().equalsIgnoreCase(typeStr)) return type;
        }
        return AnimalType.Lactating;
    }

    private String getFileExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        return idx > 0 ? filename.substring(idx + 1) : "";
    }

    private UUID getTenantFarmId() {
        UUID farmId = TenantContext.getFarmId();
        return farmId != null ? farmId : UUID.fromString("00000000-0000-0000-0000-000000000001");
    }
}
