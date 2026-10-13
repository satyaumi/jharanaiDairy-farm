package com.dairyfarm.app.modules.alert;

import com.dairyfarm.app.modules.alert.dto.CreateAlertRequest;
import com.dairyfarm.app.modules.alert.model.FarmAlert;
import com.dairyfarm.app.modules.alert.repository.FarmAlertRepository;
import com.dairyfarm.app.modules.auth.dto.SignupRequest;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.feed.model.FeedItem;
import com.dairyfarm.app.modules.feed.repository.FeedItemRepository;
import com.dairyfarm.app.modules.stock.model.StockItem;
import com.dairyfarm.app.modules.stock.repository.StockItemRepository;
import com.dairyfarm.app.modules.stock.service.StockService;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class RoleSeparationAndAlertIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FeedItemRepository feedItemRepository;

    @Autowired
    private StockItemRepository stockItemRepository;

    @Autowired
    private StockService stockService;

    @Autowired
    private FarmAlertRepository alertRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String ownerToken;
    private String managerToken;
    private String workerToken;
    private User ownerUser;
    private User managerUser;
    private User workerUser;
    private Farm farm;

    @BeforeEach
    void setupThreeRoles() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        // 1. Signup Owner & Farm
        SignupRequest signup = SignupRequest.builder()
                .name("Owner " + suffix)
                .phone("+91 977" + suffix)
                .password("Pass@123")
                .farmName("Jharanaai Test Farm " + suffix)
                .role(Role.OWNER)
                .build();

        MvcResult signupRes = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signup)))
                .andExpect(status().isCreated())
                .andReturn();

        ownerToken = objectMapper.readTree(signupRes.getResponse().getContentAsString()).get("token").asText();
        String ownerId = objectMapper.readTree(signupRes.getResponse().getContentAsString()).get("user").get("id").asText();
        ownerUser = userRepository.findById(UUID.fromString(ownerId)).orElseThrow();
        farm = ownerUser.getFarm();

        // 2. Create Manager user
        managerUser = User.builder()
                .farm(farm)
                .fullName("Manager " + suffix)
                .mobileNumber("+91 966" + suffix)
                .email("mgr" + suffix + "@test.com")
                .passwordHash(passwordEncoder.encode("Pass@123"))
                .role(Role.MANAGER)
                .build();
        managerUser = userRepository.save(managerUser);

        MvcResult loginMgr = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phoneOrEmail", managerUser.getMobileNumber(), "password", "Pass@123"))))
                .andExpect(status().isOk())
                .andReturn();
        managerToken = objectMapper.readTree(loginMgr.getResponse().getContentAsString()).get("token").asText();

        // 3. Create Worker user
        workerUser = User.builder()
                .farm(farm)
                .fullName("Worker " + suffix)
                .mobileNumber("+91 955" + suffix)
                .email("wrk" + suffix + "@test.com")
                .passwordHash(passwordEncoder.encode("Pass@123"))
                .role(Role.WORKER)
                .build();
        workerUser = userRepository.save(workerUser);

        MvcResult loginWrk = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phoneOrEmail", workerUser.getMobileNumber(), "password", "Pass@123"))))
                .andExpect(status().isOk())
                .andReturn();
        workerToken = objectMapper.readTree(loginWrk.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void testRoleSeparation_OwnerCannotPerformRoutineOps_WorkerCannotManageTeamOrReports() throws Exception {
        // Worker trying to create Alert -> 403 Forbidden
        mockMvc.perform(post("/api/alerts")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("title", "Worker alert", "message", "Test alert"))))
                .andExpect(status().isForbidden());

        // Worker trying to access Team Management -> 403 Forbidden
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());

        // Worker trying to export Certified Reports -> 403 Forbidden
        mockMvc.perform(get("/api/reports/export")
                        .header("Authorization", "Bearer " + workerToken)
                        .param("format", "csv")
                        .param("module", "milk"))
                .andExpect(status().isForbidden());

        // Manager CAN access Team Management
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        // Manager CAN create animal
        mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("earTag", "C-MGR-TEST", "breed", "Gir"))))
                .andExpect(status().isCreated());
    }

    @Test
    void testFeedLedger_50kgSupply_30kgFeed_10kgFeed_25kgSupply_InventoryCalculation() throws Exception {
        // Create test feed item & stock item
        FeedItem feed = feedItemRepository.save(FeedItem.builder()
                .farm(farm)
                .englishName("Nada Straw")
                .localName("ନଡ଼ା")
                .shortName("Nada")
                .displayName("ନଡ଼ା (Nada Straw)")
                .unit("KG")
                .category("DRY_FODDER")
                .active(true)
                .build());

        StockItem stock = stockItemRepository.save(StockItem.builder()
                .farm(farm)
                .feedItem(feed)
                .itemName(feed.getDisplayName())
                .unit("KG")
                .minThreshold(BigDecimal.valueOf(20))
                .active(true)
                .build());

        // Step 1: Supply 50 KG of configured feed item
        Map<String, Object> supply1 = new HashMap<>();
        supply1.put("feedItemId", feed.getId().toString());
        supply1.put("transactionType", "SUPPLY");
        supply1.put("quantity", 50.0);
        supply1.put("unit", "KG");
        supply1.put("notes", "50 KG fresh harvest arrival");

        mockMvc.perform(post("/api/stock/transactions")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(supply1)))
                .andExpect(status().isCreated());

        BigDecimal bal1 = stockService.getAvailableStock(farm.getId(), stock.getId());
        assertThat(bal1).isEqualByComparingTo(new BigDecimal("50.00"));

        // Step 2: Save 30 KG feed round -> Stock must become 20 KG
        Map<String, Object> feedRound1 = new HashMap<>();
        feedRound1.put("feedItemId", feed.getId().toString());
        feedRound1.put("feedType", feed.getDisplayName());
        feedRound1.put("quantityKg", 30.0);
        feedRound1.put("recordDate", LocalDate.now().toString());
        feedRound1.put("groupName", "Milking Herd");

        mockMvc.perform(post("/api/feeding")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(feedRound1)))
                .andExpect(status().isCreated());

        BigDecimal bal2 = stockService.getAvailableStock(farm.getId(), stock.getId());
        assertThat(bal2).isEqualByComparingTo(new BigDecimal("20.00"));

        // Step 3: Save another 10 KG feed round -> Stock must become 10 KG
        Map<String, Object> feedRound2 = new HashMap<>();
        feedRound2.put("feedItemId", feed.getId().toString());
        feedRound2.put("feedType", feed.getDisplayName());
        feedRound2.put("quantityKg", 10.0);
        feedRound2.put("recordDate", LocalDate.now().toString());
        feedRound2.put("groupName", "Dry Herd");

        mockMvc.perform(post("/api/feeding")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(feedRound2)))
                .andExpect(status().isCreated());

        BigDecimal bal3 = stockService.getAvailableStock(farm.getId(), stock.getId());
        assertThat(bal3).isEqualByComparingTo(new BigDecimal("10.00"));

        // Step 4: Add another 25 KG supply -> Stock must become 35 KG
        Map<String, Object> supply2 = new HashMap<>();
        supply2.put("feedItemId", feed.getId().toString());
        supply2.put("transactionType", "RECEIVED");
        supply2.put("quantity", 25.0);
        supply2.put("unit", "KG");
        supply2.put("notes", "25 KG restock bag");

        mockMvc.perform(post("/api/stock/transactions")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(supply2)))
                .andExpect(status().isCreated());

        BigDecimal bal4 = stockService.getAvailableStock(farm.getId(), stock.getId());
        assertThat(bal4).isEqualByComparingTo(new BigDecimal("35.00"));

        // Step 5: Prevent overconsumption (Attempt 100 KG when only 35 KG available)
        Map<String, Object> overconsume = new HashMap<>();
        overconsume.put("feedItemId", feed.getId().toString());
        overconsume.put("feedType", feed.getDisplayName());
        overconsume.put("quantityKg", 100.0);
        overconsume.put("recordDate", LocalDate.now().toString());

        mockMvc.perform(post("/api/feeding")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(overconsume)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Insufficient stock")));

        // Verify stock remained intact at 35 KG
        BigDecimal balAfterFail = stockService.getAvailableStock(farm.getId(), stock.getId());
        assertThat(balAfterFail).isEqualByComparingTo(new BigDecimal("35.00"));
    }

    @Test
    void testFarmAlerts_Creation_TargetedDelivery_MarkAsRead_Permissions() throws Exception {
        // 1. Worker attempting to create an alert -> 403 Forbidden
        CreateAlertRequest workerAlertReq = CreateAlertRequest.builder()
                .title("Worker Alert")
                .message("Unauthorized attempt")
                .targetRole("OWNER")
                .build();

        mockMvc.perform(post("/api/alerts")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workerAlertReq)))
                .andExpect(status().isForbidden());

        // 2. Manager creates an alert for WORKER
        CreateAlertRequest mgrWorkerAlert = CreateAlertRequest.builder()
                .title("Check Pen 2 Temperature")
                .message("High humidity detected in pen 2. Ensure ventilation.")
                .category("FARM_OPERATIONS")
                .severity("IMPORTANT")
                .targetRole("WORKER")
                .dueDate(LocalDate.now().plusDays(1))
                .build();

        MvcResult createdResult = mockMvc.perform(post("/api/alerts")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(mgrWorkerAlert)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Check Pen 2 Temperature"))
                .andReturn();

        String alertIdStr = objectMapper.readTree(createdResult.getResponse().getContentAsString()).get("data").get("id").asText();
        UUID alertId = UUID.fromString(alertIdStr);

        // 3. Manager creates an alert for OWNER
        CreateAlertRequest mgrOwnerAlert = CreateAlertRequest.builder()
                .title("Q3 Revenue Audit Ready")
                .message("Financial statement finalized for owner sign-off.")
                .category("GENERAL")
                .severity("NORMAL")
                .targetRole("OWNER")
                .build();

        mockMvc.perform(post("/api/alerts")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(mgrOwnerAlert)))
                .andExpect(status().isCreated());

        // 4. Worker views alerts: Sees WORKER alert, but NOT OWNER alert
        MvcResult workerAlertsRes = mockMvc.perform(get("/api/alerts")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andReturn();

        String workerAlertsJson = workerAlertsRes.getResponse().getContentAsString();
        assertThat(workerAlertsJson).contains("Check Pen 2 Temperature");
        assertThat(workerAlertsJson).doesNotContain("Q3 Revenue Audit Ready");

        // 5. Owner views alerts: Sees OWNER alert, but NOT WORKER alert
        MvcResult ownerAlertsRes = mockMvc.perform(get("/api/alerts")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();

        String ownerAlertsJson = ownerAlertsRes.getResponse().getContentAsString();
        assertThat(ownerAlertsJson).contains("Q3 Revenue Audit Ready");
        assertThat(ownerAlertsJson).doesNotContain("Check Pen 2 Temperature");

        // 6. Worker marks alert as read
        mockMvc.perform(patch("/api/alerts/" + alertId + "/read")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());

        // Worker checks alerts again: isRead must be true
        mockMvc.perform(get("/api/alerts")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + alertId + "')].read").value(true));
    }
}
