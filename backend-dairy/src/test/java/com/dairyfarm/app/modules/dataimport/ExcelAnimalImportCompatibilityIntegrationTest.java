package com.dairyfarm.app.modules.dataimport;

import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.modules.animal.dto.AnimalDto;
import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.animal.model.AnimalHistory;
import com.dairyfarm.app.modules.animal.model.HistoryEventType;
import com.dairyfarm.app.modules.animal.repository.AnimalHistoryRepository;
import com.dairyfarm.app.modules.animal.repository.AnimalRepository;
import com.dairyfarm.app.modules.dataimport.dto.ImportAnalyzeResult;
import com.dairyfarm.app.modules.dataimport.dto.ImportConfirmRequest;
import com.dairyfarm.app.modules.dataimport.dto.ImportConfirmResult;
import com.dairyfarm.app.modules.dataimport.service.ImportEngineService;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import com.dairyfarm.app.modules.report.service.ReportService;
import com.dairyfarm.app.modules.user.model.Role;
import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class ExcelAnimalImportCompatibilityIntegrationTest {

    @Autowired
    private ImportEngineService importEngineService;

    @Autowired
    private ReportService reportService;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private AnimalHistoryRepository animalHistoryRepository;

    @Autowired
    private FarmRepository farmRepository;

    @Autowired
    private UserRepository userRepository;

    private Farm testFarm;
    private User testUser;

    @BeforeEach
    void setUp() {
        animalHistoryRepository.deleteAll();
        animalRepository.deleteAll();
        userRepository.deleteAll();
        farmRepository.deleteAll();

        testFarm = farmRepository.save(Farm.builder()
                .name("Jharanai Farm Test")
                .address("Odisha")
                .active(true)
                .build());

        testUser = userRepository.save(User.builder()
                .email("farmer@jharanai.test")
                .passwordHash("hashed")
                .fullName("Jharanai Manager")
                .role(Role.MANAGER)
                .farm(testFarm)
                .active(true)
                .build());

        TenantContext.setFarmId(testFarm.getId());
        TenantContext.setUserId(testUser.getId());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Should parse and analyze real Jharanai_Farm.xlsx from New Heading worksheet")
    void testAnalyzeNewHeadingWorksheet() throws Exception {
        ClassPathResource resource = new ClassPathResource("data/Jharanai_Farm.xlsx");
        assertThat(resource.exists()).isTrue();

        byte[] bytes;
        try (InputStream is = resource.getInputStream()) {
            bytes = is.readAllBytes();
        }

        MockMultipartFile file = new MockMultipartFile(
                "file", "Jharanai_Farm.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes
        );

        ImportAnalyzeResult result = importEngineService.analyzeFile(file, "COW_RECORD", testFarm.getId(), "New Heading");

        assertThat(result.getRecordType()).isEqualTo("COW_RECORD");
        assertThat(result.getTotalRows()).isEqualTo(384);
        assertThat(result.getDetectedMappings()).containsKey("Animal No");
        assertThat(result.getDetectedMappings().get("Animal No")).isEqualTo("cow_tag");
        assertThat(result.getDetectedMappings()).containsKey("Date of Birth");
        assertThat(result.getDetectedMappings().get("Date of Birth")).isEqualTo("birth_date");
        assertThat(result.getDetectedMappings()).containsKey("Milking group");
        assertThat(result.getDetectedMappings().get("Milking group")).isEqualTo("group_name");
        assertThat(result.getDetectedMappings()).containsKey("Last Vaccine name");
        assertThat(result.getDetectedMappings().get("Last Vaccine name")).isEqualTo("last_vaccine_name");
        assertThat(result.getDetectedMappings()).containsKey("No of AI attempts");
        assertThat(result.getDetectedMappings().get("No of AI attempts")).isEqualTo("ai_attempts_count");

        // Validate sample row 243 preview
        ImportAnalyzeResult.PreviewRow row243 = result.getPreviewRows().stream()
                .filter(r -> "243".equals(r.getData().get("cow_tag")))
                .findFirst()
                .orElse(null);
        assertThat(row243).isNotNull();
        assertThat(row243.getData().get("breed")).isEqualTo("HF");
    }

    @Test
    @DisplayName("Should parse and analyze real Jharanai_Farm.xlsx from multi-row Summary worksheet")
    void testAnalyzeSummaryWorksheet() throws Exception {
        ClassPathResource resource = new ClassPathResource("data/Jharanai_Farm.xlsx");
        byte[] bytes;
        try (InputStream is = resource.getInputStream()) {
            bytes = is.readAllBytes();
        }

        MockMultipartFile file = new MockMultipartFile(
                "file", "Jharanai_Farm.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", bytes
        );

        ImportAnalyzeResult result = importEngineService.analyzeFile(file, "COW_RECORD", testFarm.getId(), "Summary");

        assertThat(result.getRecordType()).isEqualTo("COW_RECORD");
        assertThat(result.getTotalRows()).isEqualTo(384);
        assertThat(result.getDetectedMappings()).containsKey("Cow No.");
        assertThat(result.getDetectedMappings().get("Cow No.")).isEqualTo("cow_tag");
        assertThat(result.getDetectedMappings()).containsKey("Medicine Used");
        assertThat(result.getDetectedMappings().get("Medicine Used")).isEqualTo("medicine_used");
    }

    @Test
    @DisplayName("Should import real farm animals, dynamically calculate age from Date of Birth, and save repeatable history")
    void testConfirmImportRepresentativeSample() {
        List<Map<String, String>> rows = new ArrayList<>();

        // Cow 1: Full details with birth date in 2021
        Map<String, String> cow1 = new HashMap<>();
        cow1.put("cow_tag", "243");
        cow1.put("breed", "HF");
        cow1.put("birth_date", "2021-03-15");
        cow1.put("animal_status", "Mother Active");
        cow1.put("lactation_cycle", "4");
        cow1.put("milking_status", "Milking");
        cow1.put("weight", "560");
        cow1.put("yield", "24.5");
        cow1.put("group_name", "A");
        cow1.put("last_calving_date", "2024-01-10");
        cow1.put("vaccination_status", "All Completed");
        cow1.put("last_vaccine_name", "FMD");
        cow1.put("last_vaccination_date", "2026-07-28");
        cow1.put("ai_attempts_count", "1");
        cow1.put("ai_date", "2026-06-01");
        cow1.put("ai_success", "Yes");
        cow1.put("bull_used", "BULL-901");
        cow1.put("drying_date", "2026-12-28");
        cow1.put("due_date", "2027-03-05");
        cow1.put("calf_dob", "2024-01-10");
        cow1.put("calf_sex", "Female");
        cow1.put("medicine_used", "HELMIGARD");
        cow1.put("medicine_dose", "110 ML");
        rows.add(cow1);

        // Cow 2: Alphanumeric tag (A-18), missing birth date (Unknown age), dry pregnant
        Map<String, String> cow2 = new HashMap<>();
        cow2.put("cow_tag", "A-18");
        cow2.put("breed", "Jersey");
        cow2.put("animal_status", "Mother Active");
        cow2.put("lactation_cycle", "2");
        cow2.put("milking_status", "Dry P");
        cow2.put("weight", "420");
        cow2.put("yield", "0.0");
        cow2.put("group_name", "B");
        rows.add(cow2);

        ImportConfirmRequest confirmReq = ImportConfirmRequest.builder()
                .recordType("COW_RECORD")
                .fileName("Jharanai_Farm_Sample.xlsx")
                .duplicatePolicy("UPDATE")
                .rows(rows)
                .build();

        ImportConfirmResult confirmResult = importEngineService.confirmImport(confirmReq, testUser.getId(), testUser.getFullName());

        assertThat(confirmResult.getCreatedCount()).isEqualTo(2);
        assertThat(confirmResult.getUpdatedCount()).isEqualTo(0);
        assertThat(confirmResult.getErrorCount()).isEqualTo(0);

        // 1. Verify Cow 243 saved correctly
        Animal saved243 = animalRepository.findByFarmIdAndEarTagIgnoreCase(testFarm.getId(), "243").orElse(null);
        assertThat(saved243).isNotNull();
        assertThat(saved243.getEarTag()).isEqualTo("243");
        assertThat(saved243.getBreed()).isEqualTo("HF");
        assertThat(saved243.getBirthDate()).isEqualTo(LocalDate.of(2021, 3, 15));
        // Verify calculated age contains years and months
        assertThat(saved243.getAge()).contains("years");
        assertThat(saved243.getMilkingStatus()).isEqualTo("Milking");
        assertThat(saved243.getLactationCycle()).isEqualTo(4);
        assertThat(saved243.getPen()).isEqualTo("A");
        assertThat(saved243.getBullUsed()).isEqualTo("BULL-901");
        assertThat(saved243.getAiSuccess()).isTrue();
        assertThat(saved243.getMedicineUsed()).isEqualTo("HELMIGARD");
        assertThat(saved243.getMedicineDose()).isEqualTo("110 ML");

        // Verify repeatable history events were logged for 243
        List<AnimalHistory> histories243 = animalHistoryRepository.findByAnimalIdAndFarmIdOrderByEventDateDescCreatedAtDesc(saved243.getId(), testFarm.getId());
        assertThat(histories243).isNotEmpty();
        assertThat(histories243.stream().anyMatch(h -> h.getEventType() == HistoryEventType.BIRTH)).isTrue();
        assertThat(histories243.stream().anyMatch(h -> h.getEventType() == HistoryEventType.VACCINATION)).isTrue();
        assertThat(histories243.stream().anyMatch(h -> h.getEventType() == HistoryEventType.AI)).isTrue();
        assertThat(histories243.stream().anyMatch(h -> h.getEventType() == HistoryEventType.CALVING)).isTrue();
        assertThat(histories243.stream().anyMatch(h -> h.getEventType() == HistoryEventType.HEALTH_CHECK)).isTrue();

        // 2. Verify Cow A-18: missing birth date shows Unknown
        Animal savedA18 = animalRepository.findByFarmIdAndEarTagIgnoreCase(testFarm.getId(), "A-18").orElse(null);
        assertThat(savedA18).isNotNull();
        assertThat(savedA18.getEarTag()).isEqualTo("A-18");
        assertThat(savedA18.getBirthDate()).isNull();
        assertThat(savedA18.getAge()).isEqualTo("Unknown");
        assertThat(savedA18.getMilkingStatus()).isEqualTo("Dry P");

        // 3. Test Update idempotency: re-importing with UPDATE policy preserves existing data without duplication
        Map<String, String> updateCow1 = new HashMap<>(cow1);
        updateCow1.put("weight", "575"); // updated weight
        updateCow1.put("milking_status", "Milking P"); // updated status

        ImportConfirmRequest updateReq = ImportConfirmRequest.builder()
                .recordType("COW_RECORD")
                .fileName("Jharanai_Farm_Update.xlsx")
                .duplicatePolicy("UPDATE")
                .rows(List.of(updateCow1))
                .build();

        ImportConfirmResult updateResult = importEngineService.confirmImport(updateReq, testUser.getId(), testUser.getFullName());
        assertThat(updateResult.getCreatedCount()).isEqualTo(0);
        assertThat(updateResult.getUpdatedCount()).isEqualTo(1);

        Animal updated243 = animalRepository.findByFarmIdAndEarTagIgnoreCase(testFarm.getId(), "243").orElse(null);
        assertThat(updated243).isNotNull();
        assertThat(updated243.getWeight()).isEqualByComparingTo(BigDecimal.valueOf(575));
        assertThat(updated243.getMilkingStatus()).isEqualTo("Milking P");
        assertThat(updated243.getBirthDate()).isEqualTo(LocalDate.of(2021, 3, 15));
    }

    @Test
    @DisplayName("Should generate export with all expanded fields that can be round-trip re-imported")
    void testExportRoundTripCompatibility() throws Exception {
        // Create an animal with all real farm fields
        Animal animal = Animal.builder()
                .farm(testFarm)
                .earTag("509")
                .animalName("509")
                .breed("HF")
                .birthDate(LocalDate.of(2022, 5, 20))
                .animalStatusCategory("Mother Active")
                .lactationCycle(3)
                .milkingStatus("Milking")
                .weight(BigDecimal.valueOf(510))
                .milkYield(BigDecimal.valueOf(22.0))
                .pen("B")
                .vaccinationStatus("All Completed")
                .lastVaccineName("Theileria")
                .lastVaccinationDate(LocalDate.of(2026, 7, 28))
                .heatDate(LocalDate.of(2026, 6, 10))
                .aiAttemptsCount(2)
                .aiDate(LocalDate.of(2026, 6, 15))
                .aiSuccess(true)
                .bullUsed("BULL-404")
                .dryingDate(LocalDate.of(2027, 1, 10))
                .dueDate(LocalDate.of(2027, 3, 20))
                .calfDob(LocalDate.of(2023, 12, 1))
                .calfSex("Female")
                .medicineUsed("ALBENDAZOLE")
                .medicineDose("100 ML")
                .active(true)
                .build();
        animal.setAge(AnimalDto.calculateAgeDisplay(animal.getBirthDate(), null));
        animalRepository.save(animal);

        // Export as CSV
        byte[] csvBytes = reportService.generateReport(com.dairyfarm.app.modules.report.dto.ReportFilterRequest.builder()
                .module("cows")
                .format("csv")
                .startDate(LocalDate.now().minusYears(1))
                .endDate(LocalDate.now())
                .build());
        String csvContent = new String(csvBytes);

        assertThat(csvContent).contains("Animal No,Breed,Date of Birth,Age,Animal Status");
        assertThat(csvContent).contains("509");
        assertThat(csvContent).contains("BULL-404");
        assertThat(csvContent).contains("Theileria");
        assertThat(csvContent).contains("ALBENDAZOLE");

        // Parse exported CSV with import engine
        MockMultipartFile exportedFile = new MockMultipartFile(
                "file", "Exported_Animals.csv", "text/csv", csvBytes
        );
        ImportAnalyzeResult analyzeResult = importEngineService.analyzeFile(exportedFile, "COW_RECORD", testFarm.getId());

        assertThat(analyzeResult.getRecordType()).isEqualTo("COW_RECORD");
        assertThat(analyzeResult.getTotalRows()).isEqualTo(1);
        assertThat(analyzeResult.getDetectedMappings().get("Animal No")).isEqualTo("cow_tag");
        assertThat(analyzeResult.getDetectedMappings().get("Breed")).isEqualTo("breed");
        assertThat(analyzeResult.getDetectedMappings().get("Date of Birth")).isEqualTo("birth_date");
        assertThat(analyzeResult.getDetectedMappings().get("Bull Used")).isEqualTo("bull_used");
    }
}
