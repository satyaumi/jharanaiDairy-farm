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
import java.io.InputStream;
import java.io.InputStreamReader;
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
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "records.csv";
        String ext = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BadRequestException("Unsupported file format: ." + ext + ". Please upload .csv, .xlsx, or .xls file.");
        }

        UUID farmId = getTenantFarmId();

        // 1. Parse raw tabular data (Headers + Rows)
        ParsedTable table = ext.equals("csv") ? parseCsv(file.getInputStream()) : parseExcel(file.getInputStream());
        if (table.headers.isEmpty()) {
            throw new BadRequestException("File contains no valid header row.");
        }

        // 2. Deterministic Record Type Detection
        String recordType = detectRecordType(table.headers);
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

                // If specific shift and litres or morning/evening columns
                Animal matchedAnimal = cowTag != null ? animalTagMap.get(cowTag.toUpperCase()) : null;
                if (matchedAnimal != null && recDate != null) {
                    String checkShift = shift != null && !shift.isBlank() ? shift : (morningMilkStr != null ? "Morning" : "Evening");
                    Optional<MilkRecord> existingOpt = milkRecordRepository.findByFarmIdAndAnimalIdAndRecordDateAndShift(
                            farmId, matchedAnimal.getId(), recDate, checkShift);

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

            } else if ("COW_RECORD".equals(recordType)) {
                String cowTag = getString(canonicalData, "cow_tag");
                if (cowTag == null || cowTag.isBlank()) {
                    errors.add("Cow Tag/Ear Tag is mandatory");
                } else if (animalTagMap.containsKey(cowTag.toUpperCase())) {
                    action = "UPDATE";
                    Animal existingCow = animalTagMap.get(cowTag.toUpperCase());
                    existingData = Map.of(
                            "name", existingCow.getAnimalName(),
                            "breed", existingCow.getBreed(),
                            "weight", existingCow.getWeight(),
                            "yield", existingCow.getMilkYield() != null ? existingCow.getMilkYield() : BigDecimal.ZERO,
                            "status", existingCow.getStatus() != null ? existingCow.getStatus() : "Healthy"
                    );
                }

                String weightStr = getString(canonicalData, "weight");
                validateNumeric(weightStr, "Weight", false, errors);
                String yieldStr = getString(canonicalData, "yield");
                validateNumeric(yieldStr, "Daily Yield", false, errors);

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
        UUID farmId = getTenantFarmId();
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new BadRequestException("Farm not found: " + farmId));

        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;

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
                        UpsertOutcome outcome = upsertMilkRecord(farm, animal, date, "Morning", amLit, batch.getId(), userId);
                        if (outcome == UpsertOutcome.CREATED) created++; else updated++;
                    }
                    if (eveningLitres != null && !eveningLitres.isBlank()) {
                        BigDecimal pmLit = new BigDecimal(eveningLitres);
                        UpsertOutcome outcome = upsertMilkRecord(farm, animal, date, "Evening", pmLit, batch.getId(), userId);
                        if (outcome == UpsertOutcome.CREATED) created++; else updated++;
                    }
                    if ((morningLitres == null || morningLitres.isBlank()) && (eveningLitres == null || eveningLitres.isBlank())) {
                        String s = (shift != null && !shift.isBlank()) ? shift : "Morning";
                        BigDecimal lit = litresStr != null && !litresStr.isBlank() ? new BigDecimal(litresStr) : BigDecimal.ZERO;
                        UpsertOutcome outcome = upsertMilkRecord(farm, animal, date, s, lit, batch.getId(), userId);
                        if (outcome == UpsertOutcome.CREATED) created++; else updated++;
                    }

                    // Synchronize animal's last milking date and yield
                    animal.setLastMilkingDate(java.time.Instant.now());
                    animalRepository.save(animal);

                } else if ("COW_RECORD".equalsIgnoreCase(request.getRecordType())) {
                    String cowTag = row.get("cow_tag");
                    String name = row.get("cow_name");
                    String breed = row.get("breed");
                    String type = row.get("type");
                    String weightStr = row.get("weight");
                    String yieldStr = row.get("yield");
                    String pen = row.get("pen");

                    if (cowTag == null || cowTag.isBlank()) {
                        errors++;
                        errorDetails.add(Map.of("row", rowNum, "field", "cow_tag", "error", "Cow tag is mandatory"));
                        continue;
                    }

                    if (animalMap.containsKey(cowTag.trim().toUpperCase())) {
                        // Update existing cow
                        Animal existing = animalMap.get(cowTag.trim().toUpperCase());
                        if (name != null && !name.isBlank()) existing.setAnimalName(name);
                        if (breed != null && !breed.isBlank()) existing.setBreed(breed);
                        if (pen != null && !pen.isBlank()) existing.setPen(pen);
                        if (weightStr != null && !weightStr.isBlank()) existing.setWeight(new BigDecimal(weightStr));
                        if (yieldStr != null && !yieldStr.isBlank()) existing.setMilkYield(new BigDecimal(yieldStr));
                        animalRepository.save(existing);
                        updated++;
                        auditService.record("IMPORT_UPDATE_COW", "Animal", existing.getId().toString(),
                                "Updated cow " + cowTag + " from batch " + batchCode);
                    } else {
                        // Create new cow
                        Animal newCow = Animal.builder()
                                .farm(farm)
                                .earTag(cowTag.trim().toUpperCase())
                                .animalName(name != null && !name.isBlank() ? name : "Cow-" + cowTag)
                                .breed(breed != null && !breed.isBlank() ? breed : "Holstein")
                                .animalType(type != null && !type.isBlank() ? parseAnimalType(type) : AnimalType.Lactating)
                                .status("Healthy")
                                .weight(weightStr != null && !weightStr.isBlank() ? new BigDecimal(weightStr) : BigDecimal.valueOf(450))
                                .milkYield(yieldStr != null && !yieldStr.isBlank() ? new BigDecimal(yieldStr) : BigDecimal.ZERO)
                                .pen(pen != null && !pen.isBlank() ? pen : "Barn A")
                                .active(true)
                                .build();
                        Animal saved = animalRepository.save(newCow);
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
                String.format("Batch %s: created=%d, updated=%d, errors=%d", batchCode, created, updated, errors));

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
                .message(String.format("Successfully synchronized %d records (%d created, %d updated).",
                        created + updated, created, updated))
                .errorDetails(errorDetails)
                .build();
    }

    private enum UpsertOutcome { CREATED, UPDATED }

    private UpsertOutcome upsertMilkRecord(Farm farm, Animal animal, LocalDate date, String shift,
                                          BigDecimal litres, UUID batchId, UUID userId) {
        Optional<MilkRecord> existingOpt = milkRecordRepository.findByFarmIdAndAnimalIdAndRecordDateAndShift(
                farm.getId(), animal.getId(), date, shift);

        if (existingOpt.isPresent()) {
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
                if (norm.contains("name")) target = "cow_name";
                else target = "cow_tag";
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
                    new ImportAnalyzeResult.FieldDefinition("cow_tag", "Ear Tag", true, "COW-101", "Ear Tag ID"),
                    new ImportAnalyzeResult.FieldDefinition("cow_name", "Animal Name", false, "Gauri", "Name or identifier"),
                    new ImportAnalyzeResult.FieldDefinition("breed", "Breed", false, "Holstein", "Cattle breed"),
                    new ImportAnalyzeResult.FieldDefinition("type", "Type / Life Stage", false, "Lactating", "Lactating, Pregnant, Calf, Dry"),
                    new ImportAnalyzeResult.FieldDefinition("weight", "Weight (kg)", false, "480", "Animal weight in kg"),
                    new ImportAnalyzeResult.FieldDefinition("yield", "Daily Yield (L)", false, "22.5", "Expected daily milk yield"),
                    new ImportAnalyzeResult.FieldDefinition("pen", "Pen / Shed", false, "Barn A", "Living enclosure")
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
