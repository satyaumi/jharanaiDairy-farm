package com.dairyfarm.app.modules.report.service;

import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.animal.model.AnimalType;
import com.dairyfarm.app.modules.animal.repository.AnimalRepository;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import com.dairyfarm.app.modules.feed.model.FeedRecord;
import com.dairyfarm.app.modules.feed.repository.FeedRecordRepository;
import com.dairyfarm.app.modules.milk.model.MilkRecord;
import com.dairyfarm.app.modules.milk.repository.MilkRecordRepository;
import com.dairyfarm.app.modules.report.dto.ReportFilterRequest;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final MilkRecordRepository milkRecordRepository;
    private final AnimalRepository animalRepository;
    private final FeedRecordRepository feedRecordRepository;
    private final FarmRepository farmRepository;

    private static final String FARM_NAME = "Jharanai Farm";

    @Transactional(readOnly = true)
    public byte[] generateReport(ReportFilterRequest filter) throws Exception {
        String format = filter.getFormat() != null ? filter.getFormat().toLowerCase().trim() : "csv";
        String module = filter.getModule() != null ? filter.getModule().toLowerCase().trim() : "milk";

        LocalDate start = filter.getStartDate() != null ? filter.getStartDate() : LocalDate.now().minusDays(30);
        LocalDate end = filter.getEndDate() != null ? filter.getEndDate() : LocalDate.now();

        UUID farmId = resolveFarmId();

        // 1. Resolve Active Animals (Filtered by cowTag, status, or limit)
        List<Animal> animals = resolveAnimals(farmId, filter);

        switch (format) {
            case "xlsx":
            case "excel":
                return generateExcelReport(module, farmId, start, end, filter, animals);
            case "pdf":
                return generatePdfReport(module, farmId, start, end, filter, animals);
            case "csv":
            default:
                return generateCsvReport(module, farmId, start, end, filter, animals);
        }
    }

    public String getFilename(ReportFilterRequest filter) {
        String module = filter.getModule() != null ? filter.getModule().toLowerCase() : "farm";
        String format = filter.getFormat() != null ? filter.getFormat().toLowerCase() : "csv";
        if (format.equals("excel")) {
            format = "xlsx";
        }
        String scope = "";
        if (filter.getCowTag() != null && !filter.getCowTag().isBlank() && !filter.getCowTag().equalsIgnoreCase("all")) {
            scope = "_" + filter.getCowTag().trim().toUpperCase();
        }
        String dateStr = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
        return String.format("Jharanai_Farm_%s%s_%s.%s", capitalize(module), scope, dateStr, format);
    }

    public String getContentType(String format) {
        if (format == null) return "text/csv; charset=UTF-8";
        switch (format.toLowerCase()) {
            case "xlsx":
            case "excel":
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "pdf":
                return "application/pdf";
            case "csv":
            default:
                return "text/csv; charset=UTF-8";
        }
    }

    private UUID resolveFarmId() {
        UUID farmId = TenantContext.getFarmId();
        if (farmId == null) {
            farmId = farmRepository.findAll().stream().findFirst().map(Farm::getId)
                    .orElse(UUID.fromString("a0000000-0000-0000-0000-000000000001"));
        }
        return farmId;
    }

    private List<Animal> resolveAnimals(UUID farmId, ReportFilterRequest filter) {
        List<Animal> animals = animalRepository.findByFarmIdAndActiveTrue(farmId);
        if (animals.isEmpty()) {
            animals = animalRepository.findByActiveTrue();
        }

        // Filter by specific Cow Ear Tag (individual cow report)
        if (filter.getCowTag() != null && !filter.getCowTag().isBlank() && !filter.getCowTag().equalsIgnoreCase("all")) {
            String targetTag = filter.getCowTag().trim();
            animals = animals.stream()
                    .filter(a -> matchesCow(a, targetTag))
                    .collect(Collectors.toList());
        }

        // Filter by health status
        if (filter.getStatus() != null && !filter.getStatus().isBlank() && !filter.getStatus().equalsIgnoreCase("all")) {
            String st = filter.getStatus().trim();
            animals = animals.stream()
                    .filter(a -> a.getStatus() != null && a.getStatus().equalsIgnoreCase(st))
                    .collect(Collectors.toList());
        }

        // Limit custom record count if requested
        if (filter.getLimit() != null && filter.getLimit() > 0 && animals.size() > filter.getLimit()) {
            animals = animals.subList(0, filter.getLimit());
        }

        return animals;
    }

    private boolean matchesCow(Animal a, String target) {
        if (a == null || target == null) return false;
        String rawTarget = target.trim().toUpperCase();
        String cleanTarget = rawTarget.replaceAll("[^A-Z0-9]", "");

        if (a.getEarTag() != null) {
            String rawTag = a.getEarTag().trim().toUpperCase();
            String cleanTag = rawTag.replaceAll("[^A-Z0-9]", "");
            if (rawTag.equals(rawTarget) || cleanTag.equals(cleanTarget) || cleanTag.endsWith(cleanTarget) || cleanTarget.endsWith(cleanTag)) {
                return true;
            }
        }
        if (a.getAnimalName() != null) {
            String rawName = a.getAnimalName().trim().toUpperCase();
            if (rawName.equalsIgnoreCase(rawTarget) || rawName.contains(rawTarget)) {
                return true;
            }
        }
        return false;
    }

    private List<MilkRecord> resolveMilkRecords(UUID farmId, LocalDate start, LocalDate end, ReportFilterRequest filter, List<Animal> animals) {
        List<MilkRecord> dbRecords = milkRecordRepository.findRecordsWithAnimalForExport(farmId, start, end);

        // Filter by cowTag if specified
        if (filter.getCowTag() != null && !filter.getCowTag().isBlank() && !filter.getCowTag().equalsIgnoreCase("all")) {
            String targetTag = filter.getCowTag().trim();
            dbRecords = dbRecords.stream()
                    .filter(m -> matchesCow(m.getAnimal(), targetTag))
                    .collect(Collectors.toList());
        }

        // Filter by shift
        if (filter.getShift() != null && !filter.getShift().isBlank() && !filter.getShift().equalsIgnoreCase("all")) {
            String sh = filter.getShift().trim();
            dbRecords = dbRecords.stream()
                    .filter(m -> m.getShift() != null && m.getShift().equalsIgnoreCase(sh))
                    .collect(Collectors.toList());
        }

        List<MilkRecord> resultList = new ArrayList<>(dbRecords);

        // Sort descending by date and shift
        resultList.sort((a, b) -> {
            int comp = b.getRecordDate().compareTo(a.getRecordDate());
            if (comp != 0) return comp;
            return a.getShift().compareTo(b.getShift());
        });

        // Limit custom count if requested
        if (filter.getLimit() != null && filter.getLimit() > 0 && resultList.size() > filter.getLimit()) {
            resultList = resultList.subList(0, filter.getLimit());
        }

        return resultList;
    }

    private List<FeedRecord> resolveFeedRecords(UUID farmId, LocalDate start, LocalDate end, ReportFilterRequest filter, List<Animal> animals) {
        List<FeedRecord> feeds = feedRecordRepository.findByFarmIdAndRecordDateBetweenOrderByRecordDateDescCreatedAtDesc(farmId, start, end);
        if (filter.getLimit() != null && filter.getLimit() > 0 && feeds.size() > filter.getLimit()) {
            feeds = feeds.subList(0, filter.getLimit());
        }
        return feeds;
    }

    // ==========================================
    // CSV GENERATION
    // ==========================================

    private byte[] generateCsvReport(String module, UUID farmId, LocalDate start, LocalDate end,
                                    ReportFilterRequest filter, List<Animal> animals) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        baos.write(0xEF); // UTF-8 BOM
        baos.write(0xBB);
        baos.write(0xBF);

        PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8));

        String scopeTitle = (filter.getCowTag() != null && !filter.getCowTag().isBlank() && !filter.getCowTag().equalsIgnoreCase("all"))
                ? "Individual Cow: " + filter.getCowTag().toUpperCase()
                : "Full Farm Herd Scope";

        writer.println(ExportSecurityUtil.escapeCsv(FARM_NAME + " - Certified Operational Report"));
        writer.println(ExportSecurityUtil.escapeCsv("Module: " + capitalize(module)) + "," +
                ExportSecurityUtil.escapeCsv("Scope: " + scopeTitle) + "," +
                ExportSecurityUtil.escapeCsv("Period: " + start + " to " + end) + "," +
                ExportSecurityUtil.escapeCsv("Generated: " + LocalDate.now()));
        writer.println();

        if ("cows".equals(module) || "animals".equals(module) || "herd".equals(module)) {
            writer.println("Animal No,Breed,Date of Birth,Age,Animal Status,No of Lactation,Sire,Dam,Last Calving Date,Milking Status,Weight,Vaccination,Last Vaccine Name,Date of Vaccination,Heating Date,No of AI Attempts,Last AI Date,Success,Bull Used,Drying Date,Expected Due Date,Calf DoB,Calf Sex,Daily Yield (L),Milking Group,Medicine Used,Medicine Dose,Gestation Days,Inter Calving Days,Remarks");
            for (Animal a : animals) {
                String dynamicAge = AnimalDto.calculateAgeDisplay(a.getBirthDate(), a.getAge());
                writer.println(String.join(",",
                        ExportSecurityUtil.escapeCsv(a.getEarTag()),
                        ExportSecurityUtil.escapeCsv(a.getBreed()),
                        ExportSecurityUtil.escapeCsv(a.getBirthDate() != null ? a.getBirthDate().toString() : ""),
                        ExportSecurityUtil.escapeCsv(dynamicAge),
                        ExportSecurityUtil.escapeCsv(a.getAnimalStatusCategory() != null ? a.getAnimalStatusCategory() : (a.getStatus() != null ? a.getStatus() : "Mother Active")),
                        ExportSecurityUtil.escapeCsv(String.valueOf(a.getLactationCycle())),
                        ExportSecurityUtil.escapeCsv(a.getFatherTag() != null ? a.getFatherTag() : ""),
                        ExportSecurityUtil.escapeCsv(a.getMotherTag() != null ? a.getMotherTag() : ""),
                        ExportSecurityUtil.escapeCsv(a.getLastCalvingDate() != null ? a.getLastCalvingDate().toString() : ""),
                        ExportSecurityUtil.escapeCsv(a.getMilkingStatus() != null ? a.getMilkingStatus() : "Milking"),
                        ExportSecurityUtil.escapeCsv(a.getWeight() != null ? a.getWeight().toString() : "0"),
                        ExportSecurityUtil.escapeCsv(a.getVaccinationStatus() != null ? a.getVaccinationStatus() : "All Completed"),
                        ExportSecurityUtil.escapeCsv(a.getLastVaccineName() != null ? a.getLastVaccineName() : ""),
                        ExportSecurityUtil.escapeCsv(a.getLastVaccinationDate() != null ? a.getLastVaccinationDate().toString() : ""),
                        ExportSecurityUtil.escapeCsv(a.getHeatDate() != null ? a.getHeatDate().toString() : ""),
                        ExportSecurityUtil.escapeCsv(a.getAiAttemptsCount() != null ? a.getAiAttemptsCount().toString() : "0"),
                        ExportSecurityUtil.escapeCsv(a.getAiDate() != null ? a.getAiDate().toString() : ""),
                        ExportSecurityUtil.escapeCsv(a.getAiSuccess() != null ? (a.getAiSuccess() ? "Yes" : "No") : ""),
                        ExportSecurityUtil.escapeCsv(a.getBullUsed() != null ? a.getBullUsed() : ""),
                        ExportSecurityUtil.escapeCsv(a.getDryingDate() != null ? a.getDryingDate().toString() : ""),
                        ExportSecurityUtil.escapeCsv(a.getDueDate() != null ? a.getDueDate().toString() : ""),
                        ExportSecurityUtil.escapeCsv(a.getCalfDob() != null ? a.getCalfDob().toString() : ""),
                        ExportSecurityUtil.escapeCsv(a.getCalfSex() != null ? a.getCalfSex() : ""),
                        ExportSecurityUtil.escapeCsv(a.getMilkYield() != null ? a.getMilkYield().toString() : "0"),
                        ExportSecurityUtil.escapeCsv(a.getPen() != null ? a.getPen() : ""),
                        ExportSecurityUtil.escapeCsv(a.getMedicineUsed() != null ? a.getMedicineUsed() : ""),
                        ExportSecurityUtil.escapeCsv(a.getMedicineDose() != null ? a.getMedicineDose() : ""),
                        ExportSecurityUtil.escapeCsv(a.getGestationDays() != null ? a.getGestationDays().toString() : ""),
                        ExportSecurityUtil.escapeCsv(a.getInterCalvingDays() != null ? a.getInterCalvingDays().toString() : ""),
                        ExportSecurityUtil.escapeCsv(a.getRemarks() != null ? a.getRemarks() : "")
                ));
            }
            writer.println();
            writer.println(ExportSecurityUtil.escapeCsv("Total Head Count:") + ",," + ExportSecurityUtil.escapeCsv(animals.size() + " Animals"));

        } else if ("feeding".equals(module) || "feed".equals(module)) {
            List<FeedRecord> feeds = resolveFeedRecords(farmId, start, end, filter, animals);
            writer.println("Date,Feed Type,Target Group,Quantity (kg),Recorded By,Notes,Source");
            BigDecimal totalKg = BigDecimal.ZERO;
            for (FeedRecord f : feeds) {
                totalKg = totalKg.add(f.getQuantityKg() != null ? f.getQuantityKg() : BigDecimal.ZERO);
                writer.println(String.join(",",
                        ExportSecurityUtil.escapeCsv(f.getRecordDate().toString()),
                        ExportSecurityUtil.escapeCsv(f.getFeedType()),
                        ExportSecurityUtil.escapeCsv(f.getGroupName()),
                        ExportSecurityUtil.escapeCsv(f.getQuantityKg() != null ? f.getQuantityKg().toString() : "0"),
                        ExportSecurityUtil.escapeCsv(f.getRecordedBy() != null ? f.getRecordedBy() : ""),
                        ExportSecurityUtil.escapeCsv(f.getNotes() != null ? f.getNotes() : ""),
                        ExportSecurityUtil.escapeCsv(f.getSourceType() != null ? f.getSourceType() : "MANUAL")
                ));
            }
            writer.println();
            writer.println(ExportSecurityUtil.escapeCsv("Total Feed Distributed:") + ",,," + ExportSecurityUtil.escapeCsv(totalKg + " kg"));

        } else {
            // Default: Milk Production Records
            List<MilkRecord> milkRecords = resolveMilkRecords(farmId, start, end, filter, animals);
            writer.println("Date,Cow Tag,Cow Name,Breed,Shift,Litres,Quality,Fat %,SNF %,Source");
            BigDecimal totalLitres = BigDecimal.ZERO;

            for (MilkRecord m : milkRecords) {
                totalLitres = totalLitres.add(m.getLitres() != null ? m.getLitres() : BigDecimal.ZERO);
                writer.println(String.join(",",
                        ExportSecurityUtil.escapeCsv(m.getRecordDate().toString()),
                        ExportSecurityUtil.escapeCsv(m.getAnimal() != null ? m.getAnimal().getEarTag() : ""),
                        ExportSecurityUtil.escapeCsv(m.getAnimal() != null ? m.getAnimal().getAnimalName() : ""),
                        ExportSecurityUtil.escapeCsv(m.getAnimal() != null ? m.getAnimal().getBreed() : ""),
                        ExportSecurityUtil.escapeCsv(m.getShift()),
                        ExportSecurityUtil.escapeCsv(m.getLitres() != null ? m.getLitres().toString() : "0.0"),
                        ExportSecurityUtil.escapeCsv(m.getQuality() != null ? m.getQuality() : "Normal"),
                        ExportSecurityUtil.escapeCsv(m.getFatPercentage() != null ? m.getFatPercentage().toString() : ""),
                        ExportSecurityUtil.escapeCsv(m.getSnfPercentage() != null ? m.getSnfPercentage().toString() : ""),
                        ExportSecurityUtil.escapeCsv(m.getSourceType() != null ? m.getSourceType() : "MANUAL")
                ));
            }
            writer.println();
            writer.println(ExportSecurityUtil.escapeCsv("Total Milk Recorded:") + ",,,," + ExportSecurityUtil.escapeCsv(totalLitres.toString() + " Litres"));
        }

        writer.flush();
        return baos.toByteArray();
    }

    // ==========================================
    // EXCEL (.xlsx) GENERATION
    // ==========================================

    private byte[] generateExcelReport(String module, UUID farmId, LocalDate start, LocalDate end,
                                      ReportFilterRequest filter, List<Animal> animals) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(capitalize(module) + " Audit");

            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            CellStyle metaStyle = workbook.createCellStyle();
            Font metaFont = workbook.createFont();
            metaFont.setItalic(true);
            metaFont.setFontHeightInPoints((short) 10);
            metaStyle.setFont(metaFont);

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle numStyle = workbook.createCellStyle();
            numStyle.setAlignment(HorizontalAlignment.RIGHT);

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            String scopeLabel = (filter.getCowTag() != null && !filter.getCowTag().isBlank() && !filter.getCowTag().equalsIgnoreCase("all"))
                    ? " [" + filter.getCowTag().toUpperCase() + "]" : " [All Herd]";
            titleCell.setCellValue(FARM_NAME + " - " + capitalize(module) + " Certified Report" + scopeLabel);
            titleCell.setCellStyle(titleStyle);

            Row metaRow = sheet.createRow(1);
            Cell metaCell = metaRow.createCell(0);
            metaCell.setCellValue(String.format("Scope: %s to %s | Generated on: %s | Verified Records", start, end, LocalDate.now()));
            metaCell.setCellStyle(metaStyle);

            int rowIdx = 3;
            String[] headers;

            if ("cows".equals(module) || "animals".equals(module) || "herd".equals(module)) {
                headers = new String[]{
                    "Animal No", "Breed", "Date of Birth", "Age", "Animal Status",
                    "No of Lactation", "Sire", "Dam", "Last Calving Date", "Milking Status",
                    "Weight", "Vaccination", "Last Vaccine Name", "Date of Vaccination",
                    "Heating Date", "No of AI Attempts", "Last AI Date", "Success",
                    "Bull Used", "Drying Date", "Expected Due Date", "Calf DoB", "Calf Sex",
                    "Daily Yield (L)", "Milking Group", "Medicine Used", "Medicine Dose",
                    "Gestation Days", "Inter Calving Days", "Remarks"
                };
                Row hRow = sheet.createRow(rowIdx++);
                for (int i = 0; i < headers.length; i++) {
                    Cell c = hRow.createCell(i);
                    c.setCellValue(headers[i]);
                    c.setCellStyle(headerStyle);
                }

                for (Animal a : animals) {
                    Row r = sheet.createRow(rowIdx++);
                    String dynamicAge = AnimalDto.calculateAgeDisplay(a.getBirthDate(), a.getAge());
                    int col = 0;
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getEarTag()));
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getBreed()));
                    r.createCell(col++).setCellValue(a.getBirthDate() != null ? a.getBirthDate().toString() : "");
                    r.createCell(col++).setCellValue(dynamicAge);
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getAnimalStatusCategory() != null ? a.getAnimalStatusCategory() : (a.getStatus() != null ? a.getStatus() : "Mother Active")));
                    r.createCell(col++).setCellValue(a.getLactationCycle());
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getFatherTag() != null ? a.getFatherTag() : ""));
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getMotherTag() != null ? a.getMotherTag() : ""));
                    r.createCell(col++).setCellValue(a.getLastCalvingDate() != null ? a.getLastCalvingDate().toString() : "");
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getMilkingStatus() != null ? a.getMilkingStatus() : "Milking"));
                    Cell cW = r.createCell(col++);
                    cW.setCellValue(a.getWeight() != null ? a.getWeight().doubleValue() : 0.0);
                    cW.setCellStyle(numStyle);
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getVaccinationStatus() != null ? a.getVaccinationStatus() : "All Completed"));
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getLastVaccineName() != null ? a.getLastVaccineName() : ""));
                    r.createCell(col++).setCellValue(a.getLastVaccinationDate() != null ? a.getLastVaccinationDate().toString() : "");
                    r.createCell(col++).setCellValue(a.getHeatDate() != null ? a.getHeatDate().toString() : "");
                    r.createCell(col++).setCellValue(a.getAiAttemptsCount() != null ? a.getAiAttemptsCount() : 0);
                    r.createCell(col++).setCellValue(a.getAiDate() != null ? a.getAiDate().toString() : "");
                    r.createCell(col++).setCellValue(a.getAiSuccess() != null ? (a.getAiSuccess() ? "Yes" : "No") : "");
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getBullUsed() != null ? a.getBullUsed() : ""));
                    r.createCell(col++).setCellValue(a.getDryingDate() != null ? a.getDryingDate().toString() : "");
                    r.createCell(col++).setCellValue(a.getDueDate() != null ? a.getDueDate().toString() : "");
                    r.createCell(col++).setCellValue(a.getCalfDob() != null ? a.getCalfDob().toString() : "");
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getCalfSex() != null ? a.getCalfSex() : ""));
                    Cell cY = r.createCell(col++);
                    cY.setCellValue(a.getMilkYield() != null ? a.getMilkYield().doubleValue() : 0.0);
                    cY.setCellStyle(numStyle);
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getPen() != null ? a.getPen() : ""));
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getMedicineUsed() != null ? a.getMedicineUsed() : ""));
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getMedicineDose() != null ? a.getMedicineDose() : ""));
                    r.createCell(col++).setCellValue(a.getGestationDays() != null ? a.getGestationDays() : 0);
                    r.createCell(col++).setCellValue(a.getInterCalvingDays() != null ? a.getInterCalvingDays() : 0);
                    r.createCell(col++).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(a.getRemarks() != null ? a.getRemarks() : ""));
                }

            } else if ("feeding".equals(module) || "feed".equals(module)) {
                headers = new String[]{"Date", "Feed Type", "Group", "Quantity (kg)", "Recorded By", "Notes"};
                Row hRow = sheet.createRow(rowIdx++);
                for (int i = 0; i < headers.length; i++) {
                    Cell c = hRow.createCell(i);
                    c.setCellValue(headers[i]);
                    c.setCellStyle(headerStyle);
                }

                List<FeedRecord> feeds = resolveFeedRecords(farmId, start, end, filter, animals);
                double totalKg = 0.0;
                for (FeedRecord f : feeds) {
                    Row r = sheet.createRow(rowIdx++);
                    r.createCell(0).setCellValue(f.getRecordDate().toString());
                    r.createCell(1).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(f.getFeedType()));
                    r.createCell(2).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(f.getGroupName()));
                    Cell cQ = r.createCell(3);
                    double q = f.getQuantityKg() != null ? f.getQuantityKg().doubleValue() : 0.0;
                    totalKg += q;
                    cQ.setCellValue(q);
                    cQ.setCellStyle(numStyle);
                    r.createCell(4).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(f.getRecordedBy()));
                    r.createCell(5).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(f.getNotes()));
                }

                Row totRow = sheet.createRow(rowIdx++);
                Cell lbl = totRow.createCell(2);
                lbl.setCellValue("TOTAL FEED (KG):");
                lbl.setCellStyle(headerStyle);
                Cell sumC = totRow.createCell(3);
                sumC.setCellValue(totalKg);
                sumC.setCellStyle(numStyle);

            } else {
                // Default: Milk
                headers = new String[]{"Date", "Cow Tag", "Cow Name", "Breed", "Shift", "Litres (L)", "Quality", "Fat %", "SNF %", "Source"};
                Row hRow = sheet.createRow(rowIdx++);
                for (int i = 0; i < headers.length; i++) {
                    Cell c = hRow.createCell(i);
                    c.setCellValue(headers[i]);
                    c.setCellStyle(headerStyle);
                }

                List<MilkRecord> milkRecords = resolveMilkRecords(farmId, start, end, filter, animals);
                double totalLitres = 0.0;

                for (MilkRecord m : milkRecords) {
                    Row r = sheet.createRow(rowIdx++);
                    r.createCell(0).setCellValue(m.getRecordDate().toString());
                    r.createCell(1).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(m.getAnimal() != null ? m.getAnimal().getEarTag() : ""));
                    r.createCell(2).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(m.getAnimal() != null ? m.getAnimal().getAnimalName() : ""));
                    r.createCell(3).setCellValue(ExportSecurityUtil.sanitizeForSpreadsheet(m.getAnimal() != null ? m.getAnimal().getBreed() : ""));
                    r.createCell(4).setCellValue(m.getShift());
                    Cell cL = r.createCell(5);
                    double l = m.getLitres() != null ? m.getLitres().doubleValue() : 0.0;
                    totalLitres += l;
                    cL.setCellValue(l);
                    cL.setCellStyle(numStyle);
                    r.createCell(6).setCellValue(m.getQuality() != null ? m.getQuality() : "Normal");
                    r.createCell(7).setCellValue(m.getFatPercentage() != null ? m.getFatPercentage().doubleValue() : 4.0);
                    r.createCell(8).setCellValue(m.getSnfPercentage() != null ? m.getSnfPercentage().doubleValue() : 8.5);
                    r.createCell(9).setCellValue(m.getSourceType() != null ? m.getSourceType() : "MANUAL");
                }

                Row totRow = sheet.createRow(rowIdx++);
                Cell lbl = totRow.createCell(4);
                lbl.setCellValue("TOTAL MILK (L):");
                lbl.setCellStyle(headerStyle);
                Cell sumC = totRow.createCell(5);
                sumC.setCellValue(totalLitres);
                sumC.setCellStyle(numStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    // ==========================================
    // PDF GENERATION
    // ==========================================

    private byte[] generatePdfReport(String module, UUID farmId, LocalDate start, LocalDate end,
                                    ReportFilterRequest filter, List<Animal> animals) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate(), 36, 36, 36, 36);
        PdfWriter.getInstance(document, baos);

        document.open();

        com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(20, 83, 45));
        com.lowagie.text.Font subFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(75, 85, 99));
        com.lowagie.text.Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(107, 114, 128));
        com.lowagie.text.Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
        com.lowagie.text.Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.BLACK);
        com.lowagie.text.Font boldCellFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.BLACK);

        String scopeText = (filter.getCowTag() != null && !filter.getCowTag().isBlank() && !filter.getCowTag().equalsIgnoreCase("all"))
                ? "Cow Dossier: " + filter.getCowTag().toUpperCase() : "Complete Farm Herd Scope";

        Paragraph farmP = new Paragraph(FARM_NAME.toUpperCase(), titleFont);
        Paragraph repP = new Paragraph(capitalize(module) + " Certified Statement · " + scopeText, subFont);
        Paragraph metaP = new Paragraph(String.format("Audit Period: %s to %s  |  Generated on: %s  |  Status: Verified",
                start, end, LocalDate.now()), metaFont);
        metaP.setSpacingAfter(15f);

        document.add(farmP);
        document.add(repP);
        document.add(metaP);

        if ("cows".equals(module) || "animals".equals(module) || "herd".equals(module)) {
            PdfPTable table = new PdfPTable(8);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{12, 18, 15, 12, 12, 10, 10, 11});

            String[] headers = {"Cow Tag", "Name", "Breed", "Type", "Status", "Weight", "Yield/Day", "Pen"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new Color(22, 101, 52));
                cell.setPadding(6);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            boolean alt = false;
            for (Animal a : animals) {
                Color bg = alt ? new Color(243, 244, 246) : Color.WHITE;
                alt = !alt;

                addCell(table, a.getEarTag(), cellFont, bg, Element.ALIGN_LEFT);
                addCell(table, a.getAnimalName(), cellFont, bg, Element.ALIGN_LEFT);
                addCell(table, a.getBreed(), cellFont, bg, Element.ALIGN_LEFT);
                addCell(table, a.getAnimalType() != null ? a.getAnimalType().name() : "", cellFont, bg, Element.ALIGN_CENTER);
                addCell(table, a.getStatus() != null ? a.getStatus() : "Healthy", cellFont, bg, Element.ALIGN_CENTER);
                addCell(table, (a.getWeight() != null ? a.getWeight() : 0) + " kg", cellFont, bg, Element.ALIGN_RIGHT);
                addCell(table, (a.getMilkYield() != null ? a.getMilkYield() : 0) + " L", cellFont, bg, Element.ALIGN_RIGHT);
                addCell(table, a.getPen() != null ? a.getPen() : "-", cellFont, bg, Element.ALIGN_LEFT);
            }
            document.add(table);

        } else if ("feeding".equals(module) || "feed".equals(module)) {
            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{15, 30, 20, 15, 20});

            String[] headers = {"Date", "Feed Ration Type", "Target Herd", "Quantity (kg)", "Officer"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new Color(22, 101, 52));
                cell.setPadding(6);
                table.addCell(cell);
            }

            List<FeedRecord> feeds = resolveFeedRecords(farmId, start, end, filter, animals);
            boolean alt = false;
            for (FeedRecord f : feeds) {
                Color bg = alt ? new Color(243, 244, 246) : Color.WHITE;
                alt = !alt;

                addCell(table, f.getRecordDate().toString(), cellFont, bg, Element.ALIGN_LEFT);
                addCell(table, f.getFeedType(), cellFont, bg, Element.ALIGN_LEFT);
                addCell(table, f.getGroupName(), cellFont, bg, Element.ALIGN_LEFT);
                addCell(table, (f.getQuantityKg() != null ? f.getQuantityKg() : 0) + " kg", cellFont, bg, Element.ALIGN_RIGHT);
                addCell(table, f.getRecordedBy() != null ? f.getRecordedBy() : "Verified", cellFont, bg, Element.ALIGN_LEFT);
            }
            document.add(table);

        } else {
            // Default: Milk
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{14, 14, 18, 15, 13, 13, 13});

            String[] headers = {"Date", "Cow Tag", "Name", "Shift", "Milk (Litres)", "Fat %", "Quality"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(new Color(22, 101, 52));
                cell.setPadding(6);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            List<MilkRecord> milkRecords = resolveMilkRecords(farmId, start, end, filter, animals);
            BigDecimal totalLitres = BigDecimal.ZERO;

            boolean alt = false;
            for (MilkRecord m : milkRecords) {
                Color bg = alt ? new Color(243, 244, 246) : Color.WHITE;
                alt = !alt;

                BigDecimal lit = m.getLitres() != null ? m.getLitres() : BigDecimal.ZERO;
                totalLitres = totalLitres.add(lit);

                addCell(table, m.getRecordDate().toString(), cellFont, bg, Element.ALIGN_LEFT);
                addCell(table, m.getAnimal() != null ? m.getAnimal().getEarTag() : "-", cellFont, bg, Element.ALIGN_LEFT);
                addCell(table, m.getAnimal() != null ? m.getAnimal().getAnimalName() : "-", cellFont, bg, Element.ALIGN_LEFT);
                addCell(table, m.getShift(), cellFont, bg, Element.ALIGN_CENTER);
                addCell(table, lit + " L", cellFont, bg, Element.ALIGN_RIGHT);
                addCell(table, m.getFatPercentage() != null ? m.getFatPercentage() + "%" : "4.2%", cellFont, bg, Element.ALIGN_RIGHT);
                addCell(table, m.getQuality() != null ? m.getQuality() : "Normal", cellFont, bg, Element.ALIGN_CENTER);
            }

            PdfPCell totalLabelCell = new PdfPCell(new Phrase("Total Milk Yield Recorded:", boldCellFont));
            totalLabelCell.setColspan(4);
            totalLabelCell.setPadding(6);
            totalLabelCell.setBackgroundColor(new Color(220, 252, 231));
            table.addCell(totalLabelCell);

            PdfPCell totalValCell = new PdfPCell(new Phrase(totalLitres + " Litres", boldCellFont));
            totalValCell.setColspan(3);
            totalValCell.setPadding(6);
            totalValCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalValCell.setBackgroundColor(new Color(220, 252, 231));
            table.addCell(totalValCell);

            document.add(table);
        }

        document.close();
        return baos.toByteArray();
    }

    private void addCell(PdfPTable table, String text, com.lowagie.text.Font font, Color bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setBackgroundColor(bg);
        cell.setHorizontalAlignment(align);
        cell.setPadding(5);
        cell.setBorderColor(new Color(229, 231, 235));
        table.addCell(cell);
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return "";
        return Character.toUpperCase(str.charAt(0)) + str.substring(1);
    }
}
