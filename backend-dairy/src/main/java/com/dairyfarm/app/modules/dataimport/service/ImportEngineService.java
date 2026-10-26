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
import com.dairyfarm.app.modules.animal.dto.AnimalDto;
import com.dairyfarm.app.modules.animal.model.AnimalHistory;
import com.dairyfarm.app.modules.animal.model.HistoryEventType;
import com.dairyfarm.app.modules.animal.repository.AnimalHistoryRepository;
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
    private final AnimalHistoryRepository animalHistoryRepository;
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
        return analyzeFile(file, expectedType, null, null);
    }

    @Transactional(readOnly = true)
    public ImportAnalyzeResult analyzeFile(MultipartFile file, String expectedType, UUID explicitFarmId) throws Exception {
        return analyzeFile(file, expectedType, explicitFarmId, null);
    }

    @Transactional(readOnly = true)
    public ImportAnalyzeResult analyzeFile(MultipartFile file, String expectedType, UUID explicitFarmId, String sheetName) throws Exception {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        if (file.getSize() > 25 * 1024 * 1024) {
            throw new BadRequestException("File size exceeds 25MB limit. Please upload a smaller file.");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "records.csv";
        String ext = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BadRequestException("Unsupported file format: ." + ext + ". Please upload .csv, .xlsx, or .xls file.");
        }

        UUID farmId = explicitFarmId != null ? explicitFarmId : getTenantFarmId();

        // 1. Parse raw tabular data (Headers + Rows)
        ParsedTable table = ext.equals("csv")
                ? parseCsv(file.getInputStream())
                : parseExcel(file.getInputStream(), sheetName);
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

        List<String> unmappedHeaders = new ArrayList<>();
        for (String h : table.headers) {
            if (!detectedMappings.containsKey(h) || detectedMappings.get(h) == null) {
                unmappedHeaders.add(h);
            }
        }

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
        int duplicateCount = 0;

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
                        duplicateCount++;
                    }
                }

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

                validateNumeric(litresStr, "Litres", false, errors);
                validateNumeric(morningMilkStr, "Morning Milk", false, errors);
                validateNumeric(eveningMilkStr, "Evening Milk", false, errors);

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
                    if (!seenCowTagsInFile.add(cleanTag)) {
                        errors.add(String.format("Duplicate Cow Number '%s' in uploaded spreadsheet (row %d)", cowTag, rowNum));
                        duplicateCount++;
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
                LocalDate bDate = null;
                if (birthDateStr != null && !birthDateStr.isBlank()) {
                    bDate = parseDate(birthDateStr);
                    if (bDate == null) {
                        warnings.add("Unrecognized birth date format: " + birthDateStr);
                    } else if (bDate.isAfter(LocalDate.now())) {
                        errors.add("Birth date cannot be in the future");
                    }
                }

                // Dynamic age calculation display in preview
                String fallbackAge = getString(canonicalData, "age");
                String dynamicAge = AnimalDto.calculateAgeDisplay(bDate, fallbackAge);
                canonicalData.put("calculated_age", dynamicAge);

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

        int newCount = Math.max(0, validCount + warningCount - conflictCount);

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
                .newCount(newCount)
                .existingCount(conflictCount)
                .duplicateCount(duplicateCount)
                .availableSheets(table.availableSheets)
                .selectedSheet(table.selectedSheet)
                .unmappedHeaders(unmappedHeaders)
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

                    animal.setLastMilkingDate(java.time.Instant.now());
                    animalRepository.save(animal);

                } else if ("COW_RECORD".equalsIgnoreCase(request.getRecordType())) {
                    String cowTag = row.get("cow_tag");
                    String name = row.get("cow_name");
                    String breed = row.get("breed");
                    String type = row.get("type");
                    String status = row.get("status");
                    String animalStatusCategory = row.get("animal_status");
                    String milkingStatus = row.get("milking_status");
                    String weightStr = row.get("weight");
                    String yieldStr = row.get("yield");
                    String pen = row.get("pen");
                    String groupName = row.get("group_name");
                    String age = row.get("age");
                    String lactationCycleStr = row.get("lactation_cycle");
                    String fatherTag = row.get("sire_tag") != null ? row.get("sire_tag") : row.get("father_tag");
                    String motherTag = row.get("dam_tag") != null ? row.get("dam_tag") : row.get("mother_tag");
                    String birthDateStr = row.get("birth_date");
                    String lastCalvingDateStr = row.get("last_calving_date");
                    String photoUrl = row.get("photo_url");
                    String vaccinationStatus = row.get("vaccination_status");
                    String lastVaccineName = row.get("last_vaccine_name");
                    String lastVaccinationDateStr = row.get("last_vaccination_date");
                    String heatDateStr = row.get("heat_date");
                    String aiAttemptsStr = row.get("ai_attempts_count");
                    String aiDateStr = row.get("ai_date");
                    String aiSuccessStr = row.get("ai_success");
                    String bullUsed = row.get("bull_used");
                    String dryingDateStr = row.get("drying_date");
                    String dueDateStr = row.get("due_date");
                    String calfDobStr = row.get("calf_dob");
                    String calfSex = row.get("calf_sex");
                    String medicineUsed = row.get("medicine_used");
                    String medicineDose = row.get("medicine_dose");
                    String gestationDaysStr = row.get("gestation_days");
                    String interCalvingDaysStr = row.get("inter_calving_days");
                    String remarks = row.get("remarks");

                    if (cowTag == null || cowTag.isBlank()) {
                        errors++;
                        errorDetails.add(Map.of("row", rowNum, "field", "cow_tag", "error", "Cow tag is mandatory"));
                        continue;
                    }

                    String cleanTag = cowTag.trim().toUpperCase();
                    LocalDate birthDate = parseDate(birthDateStr);
                    LocalDate lastCalvingDate = parseDate(lastCalvingDateStr);
                    LocalDate lastVaccinationDate = parseDate(lastVaccinationDateStr);
                    LocalDate heatDate = parseDate(heatDateStr);
                    LocalDate aiDate = parseDate(aiDateStr);
                    LocalDate dryingDate = parseDate(dryingDateStr);
                    LocalDate dueDate = parseDate(dueDateStr);
                    LocalDate calfDob = parseDate(calfDobStr);
                    String calculatedAge = AnimalDto.calculateAgeDisplay(birthDate, age);
                    Integer lactationCycle = parseInteger(lactationCycleStr);
                    Integer aiAttempts = parseInteger(aiAttemptsStr);
                    Boolean aiSuccess = parseBoolean(aiSuccessStr);
                    Integer gestationDays = parseInteger(gestationDaysStr);
                    Integer interCalvingDays = parseInteger(interCalvingDaysStr);
                    BigDecimal weight = parseDecimal(weightStr);
                    BigDecimal yield = parseDecimal(yieldStr);

                    if (animalMap.containsKey(cleanTag)) {
                        if ("SKIP".equals(dupPolicy)) {
                            skipped++;
                            continue;
                        }

                        // Update existing cow
                        Animal existing = animalMap.get(cleanTag);
                        if (name != null && !name.isBlank()) existing.setAnimalName(name.trim());
                        if (breed != null && !breed.isBlank()) existing.setBreed(breed.trim());
                        if (groupName != null && !groupName.isBlank()) existing.setPen(groupName.trim());
                        else if (pen != null && !pen.isBlank()) existing.setPen(pen.trim());
                        if (type != null && !type.isBlank()) existing.setAnimalType(parseAnimalType(type));
                        if (status != null && !status.isBlank()) existing.setStatus(status.trim());
                        if (animalStatusCategory != null && !animalStatusCategory.isBlank()) existing.setAnimalStatusCategory(animalStatusCategory.trim());
                        if (milkingStatus != null && !milkingStatus.isBlank()) existing.setMilkingStatus(milkingStatus.trim());
                        if (weight != null) existing.setWeight(weight);
                        if (yield != null) existing.setMilkYield(yield);
                        if (birthDate != null) existing.setBirthDate(birthDate);
                        existing.setAge(calculatedAge);
                        if (lactationCycle != null) existing.setLactationCycle(lactationCycle);
                        if (fatherTag != null && !fatherTag.isBlank()) existing.setFatherTag(fatherTag.trim());
                        if (motherTag != null && !motherTag.isBlank()) existing.setMotherTag(motherTag.trim());
                        if (lastCalvingDate != null) existing.setLastCalvingDate(lastCalvingDate);
                        if (photoUrl != null && !photoUrl.isBlank()) existing.setPhotoUrl(photoUrl.trim());
                        if (vaccinationStatus != null && !vaccinationStatus.isBlank()) existing.setVaccinationStatus(vaccinationStatus.trim());
                        if (lastVaccineName != null && !lastVaccineName.isBlank()) existing.setLastVaccineName(lastVaccineName.trim());
                        if (lastVaccinationDate != null) existing.setLastVaccinationDate(lastVaccinationDate);
                        if (heatDate != null) existing.setHeatDate(heatDate);
                        if (aiAttempts != null) existing.setAiAttemptsCount(aiAttempts);
                        if (aiDate != null) existing.setAiDate(aiDate);
                        if (aiSuccess != null) existing.setAiSuccess(aiSuccess);
                        if (bullUsed != null && !bullUsed.isBlank()) existing.setBullUsed(bullUsed.trim());
                        if (dryingDate != null) existing.setDryingDate(dryingDate);
                        if (dueDate != null) existing.setDueDate(dueDate);
                        if (calfDob != null) existing.setCalfDob(calfDob);
                        if (calfSex != null && !calfSex.isBlank()) existing.setCalfSex(calfSex.trim());
                        if (medicineUsed != null && !medicineUsed.isBlank()) existing.setMedicineUsed(medicineUsed.trim());
                        if (medicineDose != null && !medicineDose.isBlank()) existing.setMedicineDose(medicineDose.trim());
                        if (gestationDays != null) existing.setGestationDays(gestationDays);
                        if (interCalvingDays != null) existing.setInterCalvingDays(interCalvingDays);
                        if (remarks != null && !remarks.isBlank()) existing.setRemarks(remarks.trim());

                        Animal updatedCow = animalRepository.save(existing);
                        recordImportHistoryEvents(updatedCow, farm, user, birthDate, lastVaccinationDate, lastVaccineName, aiDate, bullUsed, lastCalvingDate, calfSex, medicineUsed, medicineDose);
                        updated++;
                        auditService.record("IMPORT_UPDATE_COW", "Animal", updatedCow.getId().toString(),
                                "Updated cow " + cowTag + " from batch " + batchCode);
                    } else {
                        // Create new cow
                        Animal.AnimalBuilder builder = Animal.builder()
                                .farm(farm)
                                .earTag(cleanTag)
                                .animalName(name != null && !name.isBlank() ? name.trim() : "Cow-" + cowTag)
                                .breed(breed != null && !breed.isBlank() ? breed.trim() : "HF")
                                .animalType(type != null && !type.isBlank() ? parseAnimalType(type) : AnimalType.Lactating)
                                .status(status != null && !status.isBlank() ? status.trim() : "Healthy")
                                .animalStatusCategory(animalStatusCategory != null && !animalStatusCategory.isBlank() ? animalStatusCategory.trim() : "Mother Active")
                                .milkingStatus(milkingStatus != null && !milkingStatus.isBlank() ? milkingStatus.trim() : "Milking")
                                .weight(weight != null ? weight : BigDecimal.valueOf(450))
                                .milkYield(yield != null ? yield : BigDecimal.ZERO)
                                .pen(groupName != null && !groupName.isBlank() ? groupName.trim() : (pen != null && !pen.isBlank() ? pen.trim() : "Main Barn"))
                                .age(calculatedAge)
                                .lactationCycle(lactationCycle != null ? lactationCycle : 1)
                                .fatherTag(fatherTag != null ? fatherTag.trim() : null)
                                .motherTag(motherTag != null ? motherTag.trim() : null)
                                .birthDate(birthDate)
                                .lastCalvingDate(lastCalvingDate)
                                .photoUrl(photoUrl)
                                .vaccinationStatus(vaccinationStatus != null ? vaccinationStatus.trim() : "None")
                                .lastVaccineName(lastVaccineName)
                                .lastVaccinationDate(lastVaccinationDate)
                                .heatDate(heatDate)
                                .aiAttemptsCount(aiAttempts)
                                .aiDate(aiDate)
                                .aiSuccess(aiSuccess)
                                .bullUsed(bullUsed)
                                .dryingDate(dryingDate)
                                .dueDate(dueDate)
                                .calfDob(calfDob)
                                .calfSex(calfSex)
                                .medicineUsed(medicineUsed)
                                .medicineDose(medicineDose)
                                .gestationDays(gestationDays)
                                .interCalvingDays(interCalvingDays)
                                .remarks(remarks)
                                .active(true);

                        Animal saved = animalRepository.save(builder.build());
                        animalMap.put(saved.getEarTag().toUpperCase(), saved);
                        recordImportHistoryEvents(saved, farm, user, birthDate, lastVaccinationDate, lastVaccineName, aiDate, bullUsed, lastCalvingDate, calfSex, medicineUsed, medicineDose);
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

    private void recordImportHistoryEvents(Animal animal, Farm farm, User user,
                                           LocalDate birthDate, LocalDate vaccinationDate, String vaccineName,
                                           LocalDate aiDate, String bullUsed,
                                           LocalDate calvingDate, String calfSex,
                                           String medicineUsed, String medicineDose) {
        List<AnimalHistory> events = new ArrayList<>();
        if (birthDate != null) {
            boolean hasBirth = animalHistoryRepository.findByAnimalIdAndFarmIdOrderByEventDateDescCreatedAtDesc(animal.getId(), farm.getId())
                    .stream().anyMatch(h -> h.getEventType() == HistoryEventType.BIRTH);
            if (!hasBirth) {
                events.add(AnimalHistory.builder()
                        .animal(animal)
                        .farm(farm)
                        .eventType(HistoryEventType.BIRTH)
                        .eventDate(birthDate)
                        .title("Birth Recorded")
                        .detail("Born on farm. Mother: " + (animal.getMotherTag() != null ? animal.getMotherTag() : "Unknown"))
                        .badge("Birth")
                        .recordedBy(user)
                        .build());
            }
        }
        if (vaccinationDate != null) {
            events.add(AnimalHistory.builder()
                    .animal(animal)
                    .farm(farm)
                    .eventType(HistoryEventType.VACCINATION)
                    .eventDate(vaccinationDate)
                    .title("Vaccination Verified")
                    .detail(String.format("Vaccination recorded: %s", vaccineName != null ? vaccineName : "Standard routine"))
                    .badge("Vaccinated")
                    .recordedBy(user)
                    .build());
        }
        if (aiDate != null) {
            events.add(AnimalHistory.builder()
                    .animal(animal)
                    .farm(farm)
                    .eventType(HistoryEventType.AI)
                    .eventDate(aiDate)
                    .title("Artificial Insemination (AI)")
                    .detail(String.format("Insemination on %s%s", aiDate, bullUsed != null ? " with Bull: " + bullUsed : ""))
                    .badge("AI")
                    .recordedBy(user)
                    .build());
        }
        if (calvingDate != null) {
            events.add(AnimalHistory.builder()
                    .animal(animal)
                    .farm(farm)
                    .eventType(HistoryEventType.CALVING)
                    .eventDate(calvingDate)
                    .title("Calving Recorded")
                    .detail(String.format("Calved on %s%s", calvingDate, calfSex != null ? " (Calf: " + calfSex + ")" : ""))
                    .badge("Calving")
                    .recordedBy(user)
                    .build());
        }
        if (medicineUsed != null && !medicineUsed.isBlank()) {
            events.add(AnimalHistory.builder()
                    .animal(animal)
                    .farm(farm)
                    .eventType(HistoryEventType.HEALTH_CHECK)
                    .eventDate(LocalDate.now())
                    .title("Medical Treatment")
                    .detail(String.format("Administered %s%s", medicineUsed, medicineDose != null ? " (Dose: " + medicineDose + ")" : ""))
                    .badge("Medicine")
                    .recordedBy(user)
                    .build());
        }
        if (!events.isEmpty()) {
            animalHistoryRepository.saveAll(events);
        }
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
        List<String> availableSheets = new ArrayList<>();
        String selectedSheet;
    }

    private ParsedTable parseCsv(InputStream in) throws Exception {
        ParsedTable table = new ParsedTable();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line = reader.readLine();
            if (line == null) return table;

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
        return parseExcel(in, null);
    }

    private ParsedTable parseExcel(InputStream in, String preferredSheet) throws Exception {
        ParsedTable table = new ParsedTable();
        try (Workbook workbook = WorkbookFactory.create(in)) {
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                table.availableSheets.add(workbook.getSheetName(i).trim());
            }

            Sheet sheet = null;
            if (preferredSheet != null && !preferredSheet.isBlank()) {
                sheet = workbook.getSheet(preferredSheet.trim());
            }
            if (sheet == null) {
                for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                    String name = workbook.getSheetName(s).trim();
                    if (name.equalsIgnoreCase("New Heading")) {
                        sheet = workbook.getSheetAt(s);
                        break;
                    }
                }
            }
            if (sheet == null) {
                sheet = workbook.getSheetAt(0);
            }
            table.selectedSheet = sheet.getSheetName();

            DataFormatter formatter = new DataFormatter();

            // Scan first 6 rows for header row containing cow/animal/tag/sl no/breed
            int headerRowIdx = -1;
            for (int r = 0; r <= Math.min(5, sheet.getLastRowNum()); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                StringBuilder rowText = new StringBuilder();
                for (Cell c : row) {
                    rowText.append(" ").append(formatter.formatCellValue(c).toLowerCase());
                }
                String text = rowText.toString();
                if (text.contains("animal no") || text.contains("cow no") || text.contains("cow number") || text.contains("ear tag") || text.contains("animal number") || (text.contains("breed") && text.contains("sire"))) {
                    headerRowIdx = r;
                    break;
                }
            }
            if (headerRowIdx == -1) headerRowIdx = 0;

            Row mainHeaderRow = sheet.getRow(headerRowIdx);
            if (mainHeaderRow == null) return table;

            Row subHeaderRow = sheet.getRow(headerRowIdx + 1);
            boolean hasSubheaders = false;
            if (subHeaderRow != null) {
                for (Cell c : subHeaderRow) {
                    String sub = formatter.formatCellValue(c).trim();
                    if (sub.equalsIgnoreCase("Best") || sub.equalsIgnoreCase("VACCINATION DATE") || sub.equalsIgnoreCase("A.I DATE") || sub.equalsIgnoreCase("BULL NAME") || sub.equalsIgnoreCase("DRYING DATE") || sub.equalsIgnoreCase("DUE DATE")) {
                        hasSubheaders = true;
                        break;
                    }
                }
            }

            int lastCol = mainHeaderRow.getLastCellNum();
            if (subHeaderRow != null && subHeaderRow.getLastCellNum() > lastCol) {
                lastCol = subHeaderRow.getLastCellNum();
            }

            for (int c = 0; c < lastCol; c++) {
                Cell hCell = mainHeaderRow.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                String primary = hCell != null ? formatter.formatCellValue(hCell).trim() : "";

                String sub = "";
                if (hasSubheaders && subHeaderRow != null) {
                    Cell sCell = subHeaderRow.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    sub = sCell != null ? formatter.formatCellValue(sCell).trim() : "";
                }

                String headerName;
                if (!primary.isEmpty() && !sub.isEmpty() && !primary.equalsIgnoreCase(sub)) {
                    headerName = primary + " - " + sub;
                } else if (!primary.isEmpty()) {
                    headerName = primary;
                } else if (!sub.isEmpty()) {
                    headerName = sub;
                } else {
                    headerName = "Column_" + (c + 1);
                }
                table.headers.add(headerName);
            }

            int dataStartRow = hasSubheaders ? headerRowIdx + 2 : headerRowIdx + 1;
            for (int r = dataStartRow; r <= sheet.getLastRowNum(); r++) {
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
        boolean hasMilk = hSet.stream().anyMatch(h -> h.contains("morning") || h.contains("evening") || h.contains("litres") || h.contains("session") || h.contains("shift"));
        boolean hasFeed = hSet.stream().anyMatch(h -> h.contains("feed") || h.contains("fodder") || h.contains("ration") || h.contains("concentrate"));
        boolean hasCowBio = hSet.stream().anyMatch(h -> h.contains("breed") || h.contains("lactation") || h.contains("sire") || h.contains("dam") || h.contains("birth") || h.contains("calving"));

        if (hasMilk && !hasCowBio) {
            return "MILK_RECORD";
        }
        if (hasFeed) {
            return "FEED_RECORD";
        }
        if (hasCowBio || hasCow) {
            return "COW_RECORD";
        }
        return "COW_RECORD";
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

            if ("COW_RECORD".equalsIgnoreCase(recordType)) {
                if (norm.contains("slno") || norm.equals("sn") || norm.equals("sno")) {
                    target = null;
                } else if (norm.contains("cowno") || norm.contains("animalno") || norm.contains("cowtag") || norm.contains("eartag") || norm.contains("animalnumber") || norm.contains("cownumber") || norm.contains("tag") || norm.equals("cow")) {
                    target = "cow_tag";
                } else if (norm.contains("name") && !norm.contains("bull") && !norm.contains("vaccine") && !norm.contains("father") && !norm.contains("mother")) {
                    target = "cow_name";
                } else if (norm.contains("breed")) {
                    target = "breed";
                } else if (norm.contains("calfdob")) {
                    target = "calf_dob";
                } else if (norm.contains("birth") || norm.contains("dob")) {
                    target = "birth_date";
                } else if (norm.contains("animalstatus") || norm.contains("motheractive") || (norm.contains("status") && !norm.contains("pregnancy") && !norm.contains("milking") && !norm.contains("vaccin"))) {
                    target = "animal_status";
                } else if (norm.contains("lactation") || norm.contains("lacno")) {
                    target = "lactation_cycle";
                } else if (norm.contains("sire") || norm.contains("father")) {
                    target = "sire_tag";
                } else if (norm.contains("dam") || norm.contains("mother")) {
                    target = "dam_tag";
                } else if (norm.contains("calving") && !norm.contains("inter") && !norm.contains("details")) {
                    target = "last_calving_date";
                } else if (norm.contains("milkingstatus") || (norm.contains("milking") && norm.contains("status"))) {
                    target = "milking_status";
                } else if (norm.contains("weight") || norm.contains("presentmonth") || norm.contains("lastmonth")) {
                    target = "weight";
                } else if (norm.contains("photo") || norm.contains("image")) {
                    target = "photo_url";
                } else if (norm.contains("vaccin") && (norm.contains("status") || norm.contains("allcompleted") || norm.contains("partcompleted") || norm.equals("vaccination"))) {
                    target = "vaccination_status";
                } else if (norm.contains("lastvaccinename") || (norm.contains("vaccine") && norm.contains("name"))) {
                    target = "last_vaccine_name";
                } else if (norm.contains("dataofvacination") || norm.contains("dateofvaccination") || (norm.contains("vaccin") && norm.contains("date"))) {
                    target = "last_vaccination_date";
                } else if (norm.contains("heating") || norm.contains("heatdate")) {
                    target = "heat_date";
                } else if (norm.contains("noofai") || norm.contains("aiattempt") || norm.contains("aidone")) {
                    target = "ai_attempts_count";
                } else if (norm.contains("aidate") || norm.contains("dateofai") || norm.contains("lastaidate") || norm.contains("attemptsdate") || (norm.contains("ai") && norm.contains("date"))) {
                    target = "ai_date";
                } else if (norm.contains("success") || norm.contains("aisuccess")) {
                    target = "ai_success";
                } else if (norm.contains("bull")) {
                    target = "bull_used";
                } else if (norm.contains("drying") || norm.contains("ai210")) {
                    target = "drying_date";
                } else if (norm.contains("duedate") || norm.contains("expecteddue") || norm.contains("ai277")) {
                    target = "due_date";
                } else if (norm.contains("calf") && (norm.contains("sex") || norm.contains("male") || norm.contains("gender") || norm.equals("calf"))) {
                    target = "calf_sex";
                } else if (norm.contains("bestyield") || norm.equals("best") || norm.contains("averagedailymilking") || norm.contains("dailyyield") || norm.contains("dailymilk") || (norm.contains("milk") && norm.contains("average"))) {
                    target = "yield";
                } else if (norm.contains("milkinggroup") || norm.contains("group") || norm.contains("pen") || norm.contains("shed")) {
                    target = "group_name";
                } else if (norm.contains("medicine")) {
                    target = "medicine_used";
                } else if (norm.contains("dose")) {
                    target = "medicine_dose";
                } else if (norm.contains("gestation")) {
                    target = "gestation_days";
                } else if (norm.contains("intercalving")) {
                    target = "inter_calving_days";
                } else if (norm.contains("remark") || norm.contains("calvingdetail") || norm.contains("notes") || norm.contains("placenta")) {
                    target = "remarks";
                } else if (norm.contains("age")) {
                    target = "age";
                }
            } else if ("MILK_RECORD".equalsIgnoreCase(recordType)) {
                if (norm.contains("cow") || norm.contains("tag") || norm.contains("animal")) {
                    target = "cow_tag";
                } else if (norm.contains("date") || norm.contains("day")) {
                    target = "record_date";
                } else if (norm.contains("morning") || norm.equals("am") || norm.contains("ammilk")) {
                    target = "morning_milk";
                } else if (norm.contains("evening") || norm.equals("pm") || norm.contains("pmmilk")) {
                    target = "evening_milk";
                } else if (norm.contains("shift") || norm.contains("session")) {
                    target = "shift";
                } else if (norm.contains("litres") || norm.contains("liters") || norm.contains("milk") || norm.contains("yield") || norm.contains("qty")) {
                    target = "litres";
                }
            } else if ("FEED_RECORD".equalsIgnoreCase(recordType)) {
                if (norm.contains("feed") || norm.contains("fodder")) {
                    target = "feed_type";
                } else if (norm.contains("group")) {
                    target = "group_name";
                } else if (norm.contains("kg") || norm.contains("amount") || norm.contains("quantity")) {
                    target = "quantity_kg";
                } else if (norm.contains("date") || norm.contains("day")) {
                    target = "record_date";
                }
            }

            mappings.put(raw, target);
        }
        return mappings;
    }

    private List<ImportAnalyzeResult.FieldDefinition> getAvailableFields(String recordType) {
        if ("MILK_RECORD".equals(recordType)) {
            return List.of(
                    new ImportAnalyzeResult.FieldDefinition("cow_tag", "Cow ID / Ear Tag", true, "243", "Unique Cow Number identifying the cow"),
                    new ImportAnalyzeResult.FieldDefinition("record_date", "Record Date", true, "2026-10-03", "Date of milking"),
                    new ImportAnalyzeResult.FieldDefinition("shift", "Shift / Session", false, "Morning", "Morning, Evening, Afternoon"),
                    new ImportAnalyzeResult.FieldDefinition("litres", "Total Litres", false, "12.5", "Litres produced"),
                    new ImportAnalyzeResult.FieldDefinition("morning_milk", "Morning Milk (L)", false, "12.5", "AM session litres"),
                    new ImportAnalyzeResult.FieldDefinition("evening_milk", "Evening Milk (L)", false, "11.0", "PM session litres")
            );
        } else if ("COW_RECORD".equals(recordType)) {
            return List.of(
                    new ImportAnalyzeResult.FieldDefinition("cow_tag", "Cow Number / Animal Number", true, "243", "Primary unique farm cow identifier"),
                    new ImportAnalyzeResult.FieldDefinition("breed", "Breed", false, "HF", "Cattle breed (HF, Jersey, Sahiwal, etc.)"),
                    new ImportAnalyzeResult.FieldDefinition("birth_date", "Date of Birth", false, "2023-03-15", "Date of birth (Age is calculated dynamically)"),
                    new ImportAnalyzeResult.FieldDefinition("animal_status", "Animal Status", false, "Mother Active", "Mother Active, Calf, Herd, Mother Sick, Calf Sick, Aged, Other"),
                    new ImportAnalyzeResult.FieldDefinition("lactation_cycle", "No of Lactation", false, "2", "Number of completed lactations"),
                    new ImportAnalyzeResult.FieldDefinition("sire_tag", "Sire", false, "SIRE-01", "Father / Sire Ear Tag"),
                    new ImportAnalyzeResult.FieldDefinition("dam_tag", "Dam", false, "DAM-01", "Mother / Dam Ear Tag"),
                    new ImportAnalyzeResult.FieldDefinition("last_calving_date", "Last Calving Date", false, "2024-01-10", "Date of last calving"),
                    new ImportAnalyzeResult.FieldDefinition("milking_status", "Milking Status", false, "Milking", "Milking, Dry NP, Milking NP, Dry P, Milking P"),
                    new ImportAnalyzeResult.FieldDefinition("weight", "Weight (kg)", false, "480", "Animal weight in kg"),
                    new ImportAnalyzeResult.FieldDefinition("photo_url", "Photo URL", false, "", "Animal photo link"),
                    new ImportAnalyzeResult.FieldDefinition("vaccination_status", "Vaccination Status", false, "All Completed", "None, All Completed, Part Completed"),
                    new ImportAnalyzeResult.FieldDefinition("last_vaccine_name", "Last Vaccine Name", false, "FMD", "Name of vaccine"),
                    new ImportAnalyzeResult.FieldDefinition("last_vaccination_date", "Date of Vaccination", false, "2026-07-28", "Date of last vaccination"),
                    new ImportAnalyzeResult.FieldDefinition("heat_date", "Heating Date", false, "2026-05-12", "Date animal was in heat"),
                    new ImportAnalyzeResult.FieldDefinition("ai_attempts_count", "No of AI Attempts", false, "1", "Count of AI attempts"),
                    new ImportAnalyzeResult.FieldDefinition("ai_date", "Last AI Date", false, "2026-06-01", "Date of AI insemination"),
                    new ImportAnalyzeResult.FieldDefinition("ai_success", "AI Success (Yes/No)", false, "Yes", "Whether AI was successful"),
                    new ImportAnalyzeResult.FieldDefinition("bull_used", "Bull Used", false, "BULL-901", "Bull identifier or semen straw used"),
                    new ImportAnalyzeResult.FieldDefinition("drying_date", "Drying Date", false, "2026-11-01", "Date cow is dried off"),
                    new ImportAnalyzeResult.FieldDefinition("due_date", "Expected Due Date", false, "2027-01-15", "Expected calving due date"),
                    new ImportAnalyzeResult.FieldDefinition("calf_dob", "Calf Date of Birth", false, "2024-01-10", "Date born calf was delivered"),
                    new ImportAnalyzeResult.FieldDefinition("calf_sex", "Calf Sex", false, "Female", "Male or Female"),
                    new ImportAnalyzeResult.FieldDefinition("yield", "Average Daily Milk / Best Yield", false, "22.5", "Average or best daily milk yield in L"),
                    new ImportAnalyzeResult.FieldDefinition("group_name", "Milking Group / Pen", false, "A", "Milking Group A-F or Pen"),
                    new ImportAnalyzeResult.FieldDefinition("medicine_used", "Medicine Used", false, "HELMIGARD", "Deworming or medical treatment administered"),
                    new ImportAnalyzeResult.FieldDefinition("medicine_dose", "Medicine Dose", false, "110 ML", "Dosage administered"),
                    new ImportAnalyzeResult.FieldDefinition("gestation_days", "Gestation Days", false, "278", "Gestation period in days"),
                    new ImportAnalyzeResult.FieldDefinition("inter_calving_days", "Inter Calving Days", false, "395", "Days between calvings"),
                    new ImportAnalyzeResult.FieldDefinition("remarks", "Remarks / Health Notes", false, "", "Operational and veterinary notes")
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
                Sheet sheet = workbook.createSheet(isCow ? "New Heading" : "Milk Harvest Template");
                CellStyle headerStyle = workbook.createCellStyle();
                Font hFont = workbook.createFont();
                hFont.setBold(true);
                hFont.setColor(IndexedColors.WHITE.getIndex());
                headerStyle.setFont(hFont);
                headerStyle.setFillForegroundColor(IndexedColors.GREEN.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

                String[] headers = isCow
                        ? new String[]{
                            "Sl No", "Animal No", "Breed", "Date of Birth", "Animal status (Mother Active/Calf/Herd/Mother sick/Calf sick/Aged/Other)",
                            "No of Lactation", "Sire", "Dam", "Last Calving Date", "Milking status for Mother  (Milking/Dry NP/Milking NP/Dry P/Milking P)",
                            "Weight", "Photo", "Vaccination (None/All completed/Part Completed)", "Last Vaccine name", "Data of Vacination",
                            "Heating date", "No of AI attempts", "Attempts date", "Last AI date", "Success (Yes/No)",
                            "Bull used", "Drying date (AI+210)", "Expected due date (AI+277)", "Calf DoB", "Calf (Male/Female)",
                            "Average daily milking", "Milking group"
                        }
                        : new String[]{"Cow Tag", "Record Date", "Session", "Litres", "Morning Milk", "Evening Milk", "Notes"};

                Row hRow = sheet.createRow(0);
                for (int i = 0; i < headers.length; i++) {
                    Cell c = hRow.createCell(i);
                    c.setCellValue(headers[i]);
                    c.setCellStyle(headerStyle);
                }

                String[][] samples = isCow
                        ? new String[][]{
                            {"1", "243", "HF", "2020-04-15", "Mother Active", "4", "SIRE-01", "DAM-01", "2023-11-10", "Milking", "560", "", "All Completed", "FMD", "2026-07-28", "2026-05-10", "1", "2026-06-01", "2026-06-01", "Yes", "BULL-901", "2026-12-28", "2027-03-05", "2023-11-10", "Female", "24.5", "A"},
                            {"2", "251", "HF", "2019-08-20", "Mother Active", "5", "SIRE-02", "DAM-02", "2023-09-12", "Milking P", "580", "", "All Completed", "Anthrax", "2026-07-28", "2026-04-18", "2", "2026-05-02", "2026-05-02", "Yes", "BULL-802", "2026-11-28", "2027-02-03", "2023-09-12", "Male", "21.0", "B"}
                        }
                        : new String[][]{
                            {"243", LocalDate.now().toString(), "Morning", "12.5", "", "", "Normal harvest"},
                            {"243", LocalDate.now().toString(), "Evening", "11.0", "", "", "Normal harvest"},
                            {"251", LocalDate.now().toString(), "Morning", "14.0", "", "", "High yield"}
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
                    writer.println("Animal No,Breed,Date of Birth,Animal status,No of Lactation,Sire,Dam,Last Calving Date,Milking status,Weight,Vaccination,Last Vaccine name,Data of Vacination,Last AI date,Success,Bull used,Drying date,Expected due date,Calf DoB,Calf (Male/Female),Average daily milking,Milking group");
                    writer.println("243,HF,2020-04-15,Mother Active,4,SIRE-01,DAM-01,2023-11-10,Milking,560,All Completed,FMD,2026-07-28,2026-06-01,Yes,BULL-901,2026-12-28,2027-03-05,2023-11-10,Female,24.5,A");
                    writer.println("251,HF,2019-08-20,Mother Active,5,SIRE-02,DAM-02,2023-09-12,Milking P,580,All Completed,Anthrax,2026-07-28,2026-05-02,Yes,BULL-802,2026-11-28,2027-02-03,2023-09-12,Male,21.0,B");
                } else {
                    writer.println("Cow Tag,Record Date,Session,Litres,Morning Milk,Evening Milk,Notes");
                    writer.println("243," + LocalDate.now() + ",Morning,12.5,,,Normal harvest");
                    writer.println("243," + LocalDate.now() + ",Evening,11.0,,,Normal harvest");
                    writer.println("251," + LocalDate.now() + ",Morning,14.0,,,High yield");
                }
                writer.flush();
            }
            return baos.toByteArray();
        }
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        String clean = dateStr.trim();
        if (clean.length() >= 10 && clean.contains(" ")) {
            clean = clean.split("\\s+")[0];
        }
        clean = clean.replace(".", "-").replace("/", "-");
        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ofPattern("d-M-yyyy"),
                DateTimeFormatter.ofPattern("MM-dd-yyyy"),
                DateTimeFormatter.ofPattern("M-d-yyyy"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ofPattern("d-MMM-yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("dd-MMM-yy", Locale.ENGLISH)
        );
        for (DateTimeFormatter f : formatters) {
            try {
                return LocalDate.parse(clean, f);
            } catch (Exception ignored) {}
        }
        return null;
    }

    private Boolean parseBoolean(String val) {
        if (val == null || val.isBlank()) return null;
        String s = val.trim().toLowerCase();
        return s.equals("yes") || s.equals("true") || s.equals("y") || s.equals("1") || s.equals("success");
    }

    private Integer parseInteger(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            return (int) Math.round(Double.parseDouble(val.trim()));
        } catch (Exception ignored) {
            return null;
        }
    }

    private BigDecimal parseDecimal(String val) {
        if (val == null || val.isBlank()) return null;
        try {
            return new BigDecimal(val.trim());
        } catch (Exception ignored) {
            return null;
        }
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
