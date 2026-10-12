package com.dairyfarm.app.modules.animal;

import com.dairyfarm.app.modules.animal.dto.CreateAnimalRequest;
import com.dairyfarm.app.modules.animal.dto.UpdateAnimalRequest;
import com.dairyfarm.app.modules.auth.dto.SignupRequest;
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
public class CowNumberAndStockSyncIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FeedItemRepository feedItemRepository;

    @Autowired
    private StockItemRepository stockItemRepository;

    @Autowired
    private StockService stockService;

    @Autowired
    private UserRepository userRepository;

    private String authToken;
    private User testUser;

    @BeforeEach
    void setupUserAndToken() throws Exception {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        SignupRequest signup = SignupRequest.builder()
                .name("Integration Farmer " + randomSuffix)
                .phone("+91 988" + randomSuffix)
                .password("Pass@123")
                .farmName("Sync Farm " + randomSuffix)
                .role(Role.OWNER)
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signup)))
                .andExpect(status().isCreated())
                .andReturn();

        authToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
        String userIdStr = objectMapper.readTree(result.getResponse().getContentAsString()).get("user").get("id").asText();
        testUser = userRepository.findById(UUID.fromString(userIdStr)).orElseThrow();
    }

    @Test
    void cowNumber_UniqueCreationAndLookup_ShouldSucceedWithoutName() throws Exception {
        String cowNo = "COW-SYNC-101";

        // 1. Create with only Cow Number (no name provided)
        CreateAnimalRequest createReq = CreateAnimalRequest.builder()
                .tag(cowNo)
                .breed("Gir Cow")
                .build();

        mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tag").value(cowNo))
                .andExpect(jsonPath("$.data.name").value(cowNo));

        // 2. Reject duplicate Cow Number
        mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Cow Number '" + cowNo + "' already exists on this farm. Please use a unique Cow Number."));

        // 3. Fetch animal by Cow Number (idOrTag endpoint)
        mockMvc.perform(get("/api/animals/" + cowNo)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tag").value(cowNo));

        // 4. Update animal by Cow Number
        UpdateAnimalRequest updateReq = UpdateAnimalRequest.builder()
                .status("Active")
                .weight(new BigDecimal("460"))
                .pen("Shed A")
                .build();

        mockMvc.perform(put("/api/animals/" + cowNo)
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tag").value(cowNo))
                .andExpect(jsonPath("$.data.status").value("Active"));

        // 5. Record Milk against valid Cow Number
        Map<String, Object> milkBody = new HashMap<>();
        milkBody.put("cowNumber", cowNo);
        milkBody.put("session", "Morning");
        milkBody.put("litres", 12.5);
        milkBody.put("date", LocalDate.now().toString());

        mockMvc.perform(post("/api/milk")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(milkBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.animalTag").value(cowNo))
                .andExpect(jsonPath("$.data.litres").value(12.5));

        // 6. Reject milk recording against nonexistent Cow Number
        Map<String, Object> ghostMilkBody = new HashMap<>();
        ghostMilkBody.put("cowNumber", "COW-GHOST-999");
        ghostMilkBody.put("session", "Evening");
        ghostMilkBody.put("litres", 8.0);
        ghostMilkBody.put("date", LocalDate.now().toString());

        mockMvc.perform(post("/api/milk")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ghostMilkBody)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("No animal found with Cow Number 'COW-GHOST-999' on this farm"));
    }

    @Test
    void feedRound_AutoSyncWithStockLedger_DeductsStockAtomically() throws Exception {
        String cowNo = "COW-FEED-201";

        // Create Cow
        CreateAnimalRequest createReq = CreateAnimalRequest.builder()
                .tag(cowNo)
                .breed("Holstein")
                .build();

        mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated());

        String feedName = "Silage " + UUID.randomUUID().toString().substring(0, 6);

        // Create Feed Item
        FeedItem feedItem = FeedItem.builder()
                .farm(testUser.getFarm())
                .displayName(feedName)
                .localName(feedName)
                .englishName(feedName)
                .category("CONCENTRATE")
                .unit("KG")
                .build();
        feedItem = feedItemRepository.save(feedItem);

        // Create Stock Item
        StockItem stockItem = StockItem.builder()
                .farm(testUser.getFarm())
                .feedItem(feedItem)
                .itemName(feedName)
                .category("FEED")
                .unit("KG")
                .build();
        stockItem = stockItemRepository.save(stockItem);

        // Initialize 50 KG opening stock in stock ledger
        com.dairyfarm.app.common.context.TenantContext.setFarmId(testUser.getFarm().getId());
        com.dairyfarm.app.common.context.TenantContext.setUserId(testUser.getId());
        try {
            stockService.recordTransaction(
                    stockItem.getId(),
                    feedItem.getId(),
                    feedName,
                    "OPENING",
                    new BigDecimal("50.00"),
                    "KG",
                    LocalDate.now(),
                    "INITIAL_BALANCE",
                    null,
                    "Initial Stock"
            );
        } finally {
            com.dairyfarm.app.common.context.TenantContext.clear();
        }

        BigDecimal initialStock = stockService.getAvailableStock(testUser.getFarm().getId(), stockItem.getId());
        assertThat(initialStock).isEqualByComparingTo(new BigDecimal("50.00"));

        // 1. Record Feeding for 10 KG
        Map<String, Object> feedingBody = new HashMap<>();
        feedingBody.put("cowNumber", cowNo);
        feedingBody.put("feedType", feedName);
        feedingBody.put("feedItemId", feedItem.getId().toString());
        feedingBody.put("quantityKg", 10.0);
        feedingBody.put("recordDate", LocalDate.now().toString());

        mockMvc.perform(post("/api/feeding")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(feedingBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.quantityKg").value(10.0));

        // Verify stock deducted by exactly 10 KG (50 -> 40)
        BigDecimal stockAfter = stockService.getAvailableStock(testUser.getFarm().getId(), stockItem.getId());
        assertThat(stockAfter).isEqualByComparingTo(new BigDecimal("40.00"));

        // 2. Prevent Overconsumption (Attempt 1000 KG when only 40 KG left)
        Map<String, Object> overconsumeBody = new HashMap<>();
        overconsumeBody.put("cowNumber", cowNo);
        overconsumeBody.put("feedType", feedName);
        overconsumeBody.put("feedItemId", feedItem.getId().toString());
        overconsumeBody.put("quantityKg", 1000.0);
        overconsumeBody.put("recordDate", LocalDate.now().toString());

        mockMvc.perform(post("/api/feeding")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(overconsumeBody)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Insufficient stock for " + feedName + ". Current available: 40.00 KG, requested deduction: 1000.0 KG"));

        // Verify stock balance remained unchanged after failed overconsumption
        BigDecimal stockAfterFail = stockService.getAvailableStock(testUser.getFarm().getId(), stockItem.getId());
        assertThat(stockAfterFail).isEqualByComparingTo(new BigDecimal("40.00"));
    }
}
