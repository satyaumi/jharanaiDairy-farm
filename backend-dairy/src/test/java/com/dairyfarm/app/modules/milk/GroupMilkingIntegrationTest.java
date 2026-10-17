package com.dairyfarm.app.modules.milk;

import com.dairyfarm.app.modules.animal.dto.CreateAnimalRequest;
import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.animal.model.AnimalGroup;
import com.dairyfarm.app.modules.animal.model.AnimalType;
import com.dairyfarm.app.modules.animal.repository.AnimalGroupRepository;
import com.dairyfarm.app.modules.animal.repository.AnimalRepository;
import com.dairyfarm.app.modules.auth.dto.SignupRequest;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.milk.model.MilkRecord;
import com.dairyfarm.app.modules.milk.repository.MilkRecordRepository;
import com.dairyfarm.app.modules.user.model.Role;
import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class GroupMilkingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private AnimalGroupRepository groupRepository;

    @Autowired
    private MilkRecordRepository milkRecordRepository;

    @Autowired
    private com.dairyfarm.app.common.security.JwtTokenProvider tokenProvider;

    private String workerToken;
    private String ownerToken;
    private Farm farm;
    private AnimalGroup groupA;
    private Animal cow1;
    private Animal cow2;
    private Animal bull;

    @BeforeEach
    void setupFarmAndRoles() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        // 1. Sign up Farm Owner
        SignupRequest ownerSignup = SignupRequest.builder()
                .name("Owner " + suffix)
                .phone("+91 911" + suffix)
                .password("Password@123")
                .farmName("Jharanaai Test Farm " + suffix)
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

        // 2. Create Farm Worker associated directly with this farm
        User workerUser = User.builder()
                .farm(farm)
                .fullName("Worker " + suffix)
                .mobileNumber("+91 922" + suffix)
                .username("worker_" + suffix)
                .passwordHash("passwordHashDummy")
                .role(Role.WORKER)
                .active(true)
                .build();
        workerUser = userRepository.save(workerUser);

        com.dairyfarm.app.common.security.UserPrincipal workerPrincipal = com.dairyfarm.app.common.security.UserPrincipal.create(
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

        // 3. Create Group A for this farm
        groupA = AnimalGroup.builder()
                .farm(farm)
                .name("Group A")
                .code("GRP-A")
                .description("High Yielding Lactating Herd (>= 18 L/day)")
                .active(true)
                .build();
        groupA = groupRepository.save(groupA);

        // 4. Create 2 Lactating Cows belonging to Group A
        cow1 = Animal.builder()
                .farm(farm)
                .group(groupA)
                .animalName("Ganga")
                .earTag("COW-" + suffix + "-01")
                .breed("Sahiwal")
                .animalType(AnimalType.Lactating)
                .status("Healthy")
                .milkYield(new BigDecimal("18.5"))
                .active(true)
                .build();
        cow1 = animalRepository.save(cow1);

        cow2 = Animal.builder()
                .farm(farm)
                .group(groupA)
                .animalName("Yamuna")
                .earTag("COW-" + suffix + "-02")
                .breed("Gir")
                .animalType(AnimalType.Lactating)
                .status("Healthy")
                .milkYield(new BigDecimal("19.0"))
                .active(true)
                .build();
        cow2 = animalRepository.save(cow2);

        // 5. Create a Breeding Bull belonging to Group A (Must be excluded from lactating milking lists)
        bull = Animal.builder()
                .farm(farm)
                .group(groupA)
                .animalName("Nandi Bull")
                .earTag("BULL-" + suffix + "-99")
                .breed("Sahiwal Bull")
                .animalType(AnimalType.Calf)
                .pen("Breeding Bull Pen")
                .status("Healthy")
                .active(true)
                .build();
        bull = animalRepository.save(bull);
    }

    @Test
    void testGroupMembership_AndAnimalEligibility() throws Exception {
        // Query Group A animals with lactatingOnly=true
        mockMvc.perform(get("/api/groups/" + groupA.getCode() + "/animals")
                        .param("lactatingOnly", "true")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.data[0].tag").value(cow1.getEarTag()))
                .andExpect(jsonPath("$.data[1].tag").value(cow2.getEarTag()));
    }

    @Test
    void testGroupMilking_BatchEntry_CalculationsAndDuplicatePrevention() throws Exception {
        LocalDate recordDate = LocalDate.now();
        String shift = "Morning";

        // Step 1: Worker records bulk group milking for cow1 and cow2
        Map<String, Object> bulkPayload = new HashMap<>();
        bulkPayload.put("shift", shift);
        bulkPayload.put("recordDate", recordDate.toString());
        bulkPayload.put("groupId", groupA.getId().toString());

        List<Map<String, Object>> entries = new ArrayList<>();
        entries.add(Map.of("cowNumber", cow1.getEarTag(), "litres", 9.5));
        entries.add(Map.of("cowNumber", cow2.getEarTag(), "litres", 10.0));
        bulkPayload.put("entries", entries);

        mockMvc.perform(post("/api/milk/bulk")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bulkPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.recordedCount").value(2))
                .andExpect(jsonPath("$.totalLitres").value(19.5));

        // Step 2: Verify in database that individual records are persisted and linked to Cow Numbers
        List<MilkRecord> records = milkRecordRepository.findByFarmIdAndRecordDateAndShift(farm.getId(), recordDate, shift);
        assertThat(records).hasSize(2);

        MilkRecord rec1 = records.stream().filter(r -> r.getAnimal().getId().equals(cow1.getId())).findFirst().orElseThrow();
        assertThat(rec1.getLitres()).isEqualByComparingTo(new BigDecimal("9.5"));
        assertThat(rec1.getShift()).isEqualTo("Morning");

        MilkRecord rec2 = records.stream().filter(r -> r.getAnimal().getId().equals(cow2.getId())).findFirst().orElseThrow();
        assertThat(rec2.getLitres()).isEqualByComparingTo(new BigDecimal("10.0"));

        // Step 3: Check summary endpoint reflects correct morning total and animal count
        mockMvc.perform(get("/api/milk/summary")
                        .param("date", recordDate.toString())
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.morningLitres").value(19.5))
                .andExpect(jsonPath("$.data.totalLitres").value(19.5))
                .andExpect(jsonPath("$.data.animalsMilkedCount").value(2));

        // Step 4: Duplicate Submission / Update Test
        // Resubmitting for cow1 with updated yield (e.g. 11.0) must update existing record, NOT create duplicate
        entries.clear();
        entries.add(Map.of("cowNumber", cow1.getEarTag(), "litres", 11.0));
        mockMvc.perform(post("/api/milk/bulk")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bulkPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        List<MilkRecord> recordsAfterUpdate = milkRecordRepository.findByFarmIdAndRecordDateAndShift(farm.getId(), recordDate, shift);
        assertThat(recordsAfterUpdate).hasSize(2); // Still 2 records, no duplicates!

        MilkRecord updatedRec1 = milkRecordRepository.findByFarmIdAndAnimalIdAndRecordDateAndShift(farm.getId(), cow1.getId(), recordDate, shift).orElseThrow();
        assertThat(updatedRec1.getLitres()).isEqualByComparingTo(new BigDecimal("11.0"));
    }

    @Test
    void testInvalidQuantity_RejectedByBackend() throws Exception {
        Map<String, Object> invalidPayload = new HashMap<>();
        invalidPayload.put("shift", "Morning");
        invalidPayload.put("recordDate", LocalDate.now().toString());

        List<Map<String, Object>> entries = List.of(
                Map.of("cowNumber", cow1.getEarTag(), "litres", -5.0)
        );
        invalidPayload.put("entries", entries);

        mockMvc.perform(post("/api/milk/bulk")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidPayload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testRoleSeparation_OwnerReadOnly_WorkerNoExport() throws Exception {
        Map<String, Object> bulkPayload = Map.of(
                "shift", "Evening",
                "recordDate", LocalDate.now().toString(),
                "entries", List.of(Map.of("cowNumber", cow1.getEarTag(), "litres", 8.0))
        );

        // 1. Owner attempt to record milk must be rejected with 403 Forbidden
        mockMvc.perform(post("/api/milk/bulk")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bulkPayload)))
                .andExpect(status().isForbidden());

        // 2. Owner CAN view milk records and summaries in read-only mode
        mockMvc.perform(get("/api/milk")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/milk/summary")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 3. Worker attempt to export certified reports must be rejected with 403 Forbidden
        mockMvc.perform(get("/api/reports/export")
                        .param("module", "audit")
                        .param("format", "PDF")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());
    }
}
