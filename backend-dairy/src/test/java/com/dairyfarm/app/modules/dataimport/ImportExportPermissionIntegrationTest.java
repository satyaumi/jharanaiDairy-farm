package com.dairyfarm.app.modules.dataimport;

import com.dairyfarm.app.common.security.JwtTokenProvider;
import com.dairyfarm.app.common.security.UserPrincipal;
import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.animal.model.AnimalType;
import com.dairyfarm.app.modules.animal.repository.AnimalRepository;
import com.dairyfarm.app.modules.auth.dto.SignupRequest;
import com.dairyfarm.app.modules.dataimport.dto.ImportConfirmRequest;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.milk.model.MilkRecord;
import com.dairyfarm.app.modules.milk.repository.MilkRecordRepository;
import com.dairyfarm.app.modules.user.model.Role;
import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ImportExportPermissionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private MilkRecordRepository milkRecordRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private String workerToken;
    private String ownerToken;
    private String managerToken;
    private Farm farm;
    private Animal cow1;
    private Animal cow2;

    @BeforeEach
    void setupFarmAndRoles() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        // 1. Sign up Farm Owner
        SignupRequest ownerSignup = SignupRequest.builder()
                .name("Owner " + suffix)
                .phone("+91 933" + suffix)
                .password("Password@123")
                .farmName("Jharanai Test Farm " + suffix)
                .role(Role.OWNER)
                .build();

        MvcResult ownerRes = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ownerSignup)))
                .andExpect(status().isCreated())
                .andReturn();

        ownerToken = objectMapper.readTree(ownerRes.getResponse().getContentAsString()).get("token").asText();
        String ownerId = objectMapper.readTree(ownerRes.getResponse().getContentAsString()).get("user").get("id").asText();
        User ownerUser = userRepository.findById(UUID.fromString(ownerId)).orElseThrow();
        farm = ownerUser.getFarm();

        // 2. Create Farm Worker
        User workerUser = User.builder()
                .farm(farm)
                .fullName("Worker " + suffix)
                .mobileNumber("+91 944" + suffix)
                .username("worker_" + suffix)
                .passwordHash("passwordHashDummy")
                .role(Role.WORKER)
                .active(true)
                .build();
        workerUser = userRepository.save(workerUser);

        UserPrincipal workerPrincipal = UserPrincipal.create(
                workerUser.getId(),
                farm.getId(),
                workerUser.getFullName(),
                workerUser.getUsername(),
                workerUser.getEmail(),
                workerUser.getMobileNumber(),
                workerUser.getPasswordHash(),
                workerUser.getRole(),
                workerUser.isActive()
        );
        workerToken = tokenProvider.generateToken(workerPrincipal);

        // 3. Create Farm Manager
        User managerUser = User.builder()
                .farm(farm)
                .fullName("Manager " + suffix)
                .mobileNumber("+91 955" + suffix)
                .username("mgr_" + suffix)
                .passwordHash("passwordHashDummy")
                .role(Role.MANAGER)
                .active(true)
                .build();
        managerUser = userRepository.save(managerUser);

        UserPrincipal managerPrincipal = UserPrincipal.create(
                managerUser.getId(),
                farm.getId(),
                managerUser.getFullName(),
                managerUser.getUsername(),
                managerUser.getEmail(),
                managerUser.getMobileNumber(),
                managerUser.getPasswordHash(),
                managerUser.getRole(),
                managerUser.isActive()
        );
        managerToken = tokenProvider.generateToken(managerPrincipal);

        // 4. Pre-seed animals in farm herd
        cow1 = animalRepository.save(Animal.builder()
                .farm(farm)
                .earTag("COW-" + suffix + "-01")
                .animalName("Gauri")
                .breed("Gir")
                .animalType(AnimalType.Lactating)
                .status("Healthy")
                .weight(BigDecimal.valueOf(450))
                .milkYield(BigDecimal.valueOf(14.5))
                .pen("Barn A")
                .active(true)
                .build());

        cow2 = animalRepository.save(Animal.builder()
                .farm(farm)
                .earTag("COW-" + suffix + "-02")
                .animalName("Lakshmi")
                .breed("Sahiwal")
                .animalType(AnimalType.Lactating)
                .status("Healthy")
                .weight(BigDecimal.valueOf(480))
                .milkYield(BigDecimal.valueOf(16.0))
                .pen("Barn B")
                .active(true)
                .build());
    }

    @Test
    @DisplayName("1. Worker can analyze and confirm Milk Harvest CSV import successfully")
    void testWorker_MilkHarvest_Import_Csv() throws Exception {
        String csvContent = "Cow Tag,Record Date,Session,Litres\n" +
                cow1.getEarTag() + ",2026-10-25,Morning,14.5\n" +
                cow2.getEarTag() + ",2026-10-25,Evening,15.0\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "milk_import.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        // 1. Analyze
        MvcResult analyzeRes = mockMvc.perform(multipart("/api/import/analyze")
                        .file(file)
                        .param("recordType", "MILK_RECORD")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recordType").value("MILK_RECORD"))
                .andExpect(jsonPath("$.data.validCount").value(2))
                .andExpect(jsonPath("$.data.errorCount").value(0))
                .andReturn();

        // 2. Confirm
        ImportConfirmRequest confirmReq = ImportConfirmRequest.builder()
                .recordType("MILK_RECORD")
                .fileName("milk_import.csv")
                .importOnlyValid(true)
                .duplicatePolicy("UPDATE")
                .mappings(Map.of("Cow Tag", "cow_tag", "Record Date", "record_date", "Session", "shift", "Litres", "litres"))
                .rows(List.of(
                        Map.of("cow_tag", cow1.getEarTag(), "record_date", "2026-10-25", "shift", "Morning", "litres", "14.5"),
                        Map.of("cow_tag", cow2.getEarTag(), "record_date", "2026-10-25", "shift", "Evening", "litres", "15.0")
                ))
                .build();

        mockMvc.perform(post("/api/import/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + workerToken)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.createdCount").value(2))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        // Verify DB persistence
        List<MilkRecord> records = milkRecordRepository.findRecordsWithAnimalForExport(
                farm.getId(), LocalDate.parse("2026-10-20"), LocalDate.parse("2026-10-28"));
        assertThat(records).hasSize(2);
    }

    @Test
    @DisplayName("2. Worker can analyze Excel (.xlsx) file and verify schema mapping")
    void testWorker_Excel_Import_Analysis() throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Milk");
            Row h = sheet.createRow(0);
            h.createCell(0).setCellValue("Ear Tag");
            h.createCell(1).setCellValue("Date");
            h.createCell(2).setCellValue("Shift");
            h.createCell(3).setCellValue("Milk Yield (L)");

            Row r1 = sheet.createRow(1);
            r1.createCell(0).setCellValue(cow1.getEarTag());
            r1.createCell(1).setCellValue("2026-10-24");
            r1.createCell(2).setCellValue("Morning");
            r1.createCell(3).setCellValue("12.5");
            wb.write(baos);
        }

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "milk_excel.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                baos.toByteArray()
        );

        mockMvc.perform(multipart("/api/import/analyze")
                        .file(file)
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recordType").value("MILK_RECORD"))
                .andExpect(jsonPath("$.data.validCount").value(1));
    }

    @Test
    @DisplayName("3. Worker can export Milk Harvest records and receive genuine database data")
    void testWorker_Export_Milk_Records() throws Exception {
        // Seed actual milk record
        milkRecordRepository.save(MilkRecord.builder()
                .farm(farm)
                .animal(cow1)
                .recordDate(LocalDate.now())
                .shift("Morning")
                .litres(BigDecimal.valueOf(17.5))
                .quality("Normal")
                .sourceType("TEST")
                .build());

        MvcResult exportRes = mockMvc.perform(get("/api/reports/export")
                        .param("module", "milk")
                        .param("format", "csv")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("text/csv")))
                .andReturn();

        String csvOutput = exportRes.getResponse().getContentAsString();
        assertThat(csvOutput).contains(cow1.getEarTag());
        assertThat(csvOutput).contains("17.5");
    }

    @Test
    @DisplayName("4. Worker can import Cow/Animal records: creates new cow and updates existing cow")
    void testWorker_Animal_Import_Create_And_Update() throws Exception {
        String newCowTag = ("COW-NEW-" + UUID.randomUUID().toString().substring(0, 6)).toUpperCase();

        // Confirm request with 1 new cow and 1 update to cow1
        ImportConfirmRequest confirmReq = ImportConfirmRequest.builder()
                .recordType("COW_RECORD")
                .fileName("cows.csv")
                .importOnlyValid(true)
                .duplicatePolicy("UPDATE")
                .rows(List.of(
                        // Update cow1 weight and yield
                        Map.of("cow_tag", cow1.getEarTag(), "cow_name", "Gauri Updated", "breed", "Gir Pure",
                                "weight", "495", "yield", "18.0", "status", "Healthy", "pen", "Barn A-Special"),
                        // Create brand new cow
                        Map.of("cow_tag", newCowTag, "cow_name", "Radhika", "breed", "Sahiwal",
                                "weight", "420", "yield", "13.5", "status", "Healthy", "pen", "Pasture 1")
                ))
                .build();

        mockMvc.perform(post("/api/import/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + workerToken)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.createdCount").value(1))
                .andExpect(jsonPath("$.data.updatedCount").value(1))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        // Verify cow1 updated
        Animal updatedCow1 = animalRepository.findById(cow1.getId()).orElseThrow();
        assertThat(updatedCow1.getAnimalName()).isEqualTo("Gauri Updated");
        assertThat(updatedCow1.getWeight()).isEqualByComparingTo(BigDecimal.valueOf(495));
        assertThat(updatedCow1.getPen()).isEqualTo("Barn A-Special");

        // Verify new cow created
        Optional<Animal> newCowOpt = animalRepository.findByFarmIdAndEarTag(farm.getId(), newCowTag);
        assertThat(newCowOpt).isPresent();
        assertThat(newCowOpt.get().getAnimalName()).isEqualTo("Radhika");
    }

    @Test
    @DisplayName("5. Worker can export Cow/Animal records and receive actual database herd")
    void testWorker_Export_Animal_Records() throws Exception {
        MvcResult exportRes = mockMvc.perform(get("/api/reports/export")
                        .param("module", "cows")
                        .param("format", "csv")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andReturn();

        String csvOutput = exportRes.getResponse().getContentAsString();
        assertThat(csvOutput).contains(cow1.getEarTag());
        assertThat(csvOutput).contains(cow2.getEarTag());
        assertThat(csvOutput).contains("Gauri");
        assertThat(csvOutput).contains("Lakshmi");
    }

    @Test
    @DisplayName("6. Duplicate Cow Numbers within uploaded file are flagged with error")
    void testDuplicate_CowNumbers_In_File_Rejected() throws Exception {
        String csvContent = "Cow Tag,Animal Name,Breed,Weight,Daily Yield\n" +
                "COW-DUP-01,Bella,Holstein,450,15.0\n" +
                "COW-DUP-01,Bella Duplicate,Holstein,460,16.0\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "duplicate_cows.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/import/analyze")
                        .file(file)
                        .param("recordType", "COW_RECORD")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.errorCount").value(1))
                .andExpect(jsonPath("$.data.previewRows[1].errors[0]").value(org.hamcrest.Matchers.containsString("Duplicate Cow Number")));
    }

    @Test
    @DisplayName("7. Non-existent cow in milk record is flagged with error in preview")
    void testNonExistentCow_MilkImport_Rejected() throws Exception {
        String csvContent = "Cow Tag,Record Date,Session,Litres\n" +
                "COW-GHOST-999,2026-10-25,Morning,14.5\n";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "ghost_milk.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/import/analyze")
                        .file(file)
                        .param("recordType", "MILK_RECORD")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.errorCount").value(1))
                .andExpect(jsonPath("$.data.previewRows[0].errors[0]").value(org.hamcrest.Matchers.containsString("not found in Jharanai herd")));
    }

    @Test
    @DisplayName("8. Owner can export but is forbidden from importing/modifying records")
    void testOwner_Export_Allowed_Import_Forbidden() throws Exception {
        // Owner export must succeed (Read-Only)
        mockMvc.perform(get("/api/reports/export")
                        .param("module", "milk")
                        .param("format", "csv")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        // Owner import analyze must be rejected (403 Forbidden)
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "milk.csv",
                "text/csv",
                "Cow Tag,Record Date,Session,Litres\n".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/import/analyze")
                        .file(file)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());

        // Owner confirm must be rejected (403 Forbidden)
        ImportConfirmRequest confirmReq = ImportConfirmRequest.builder()
                .recordType("MILK_RECORD")
                .fileName("test.csv")
                .rows(List.of(Map.of("cow_tag", cow1.getEarTag(), "record_date", "2026-10-25", "litres", "10")))
                .build();

        mockMvc.perform(post("/api/import/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + ownerToken)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("9. Worker is forbidden from exporting restricted administrative reports")
    void testWorker_Restricted_Reports_Forbidden() throws Exception {
        // Worker attempting to export team audit or settings report must receive 403 Forbidden
        mockMvc.perform(get("/api/reports/export")
                        .param("module", "team")
                        .param("format", "csv")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/reports/export")
                        .param("module", "audit")
                        .param("format", "csv")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("10. Template download endpoint returns valid template for Milk and Cow records")
    void testTemplateDownload_Milk_And_Cow() throws Exception {
        // Download milk CSV template
        MvcResult milkTmpl = mockMvc.perform(get("/api/import/template")
                        .param("type", "MILK_RECORD")
                        .param("format", "csv")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("Milk_Harvest_Template.csv")))
                .andReturn();
        assertThat(milkTmpl.getResponse().getContentAsString()).contains("Cow Tag,Record Date,Session,Litres");

        // Download cow XLSX template
        mockMvc.perform(get("/api/import/template")
                        .param("type", "COW_RECORD")
                        .param("format", "xlsx")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("Cattle_Herd_Template.xlsx")));
    }
}
