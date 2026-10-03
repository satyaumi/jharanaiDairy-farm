package com.dairyfarm.app.modules.animal;

import com.dairyfarm.app.modules.animal.dto.CreateAnimalRequest;
import com.dairyfarm.app.modules.animal.dto.CreateHistoryEventRequest;
import com.dairyfarm.app.modules.animal.dto.UpdateAnimalRequest;
import com.dairyfarm.app.modules.animal.model.AnimalType;
import com.dairyfarm.app.modules.animal.model.HistoryEventType;
import com.dairyfarm.app.modules.auth.dto.SignupRequest;
import com.dairyfarm.app.modules.user.model.Role;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AnimalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String authToken;

    @BeforeEach
    void setupUserAndToken() throws Exception {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8);
        SignupRequest signup = SignupRequest.builder()
                .name("Farmer " + randomSuffix)
                .phone("+91 977" + randomSuffix)
                .password("Pass@123")
                .farmName("Test Farm " + randomSuffix)
                .role(Role.OWNER)
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signup)))
                .andExpect(status().isCreated())
                .andReturn();

        authToken = objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void createAnimal_FastEntry_OnlyThreeFields_ShouldSucceed() throws Exception {
        CreateAnimalRequest request = CreateAnimalRequest.builder()
                .name("Daisy")
                .tag("C-1001")
                .breed("Jersey")
                .build();

        mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Daisy"))
                .andExpect(jsonPath("$.data.tag").value("C-1001"))
                .andExpect(jsonPath("$.data.breed").value("Jersey"))
                .andExpect(jsonPath("$.data.status").value("Healthy"))
                .andExpect(jsonPath("$.data.type").value("Lactating"));
    }

    @Test
    void createAnimal_WithCompleteHistory_ShouldSucceedAndCreateTimeline() throws Exception {
        CreateAnimalRequest request = CreateAnimalRequest.builder()
                .name("Bessie")
                .tag("C-2001")
                .breed("Holstein Friesian")
                .birthDate(LocalDate.of(2022, 3, 12))
                .birthStatus("Normal Calving")
                .fatherTag("C-050")
                .fatherName("Champion Sire")
                .motherTag("C-087")
                .motherName("High Yield Dam")
                .aiDate(LocalDate.of(2023, 1, 15))
                .lastVaccinationDate(LocalDate.of(2023, 8, 10))
                .build();

        MvcResult result = mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Bessie"))
                .andExpect(jsonPath("$.data.fatherTag").value("C-050"))
                .andExpect(jsonPath("$.data.motherTag").value("C-087"))
                .andExpect(jsonPath("$.data.birthDate").value("2022-03-12"))
                .andExpect(jsonPath("$.data.timeline").isArray())
                .andReturn();

        String animalId = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("data").get("id").asText();

        // Verify history endpoint retrieves the generated events
        mockMvc.perform(get("/api/animals/" + animalId + "/history")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(4)); // Birth, Registration, Vaccination, AI
    }

    @Test
    void createAnimal_DuplicateTagInSameFarm_ShouldReturnConflict() throws Exception {
        CreateAnimalRequest req1 = CreateAnimalRequest.builder()
                .name("Willow")
                .tag("C-DUP-01")
                .breed("Sahiwal")
                .build();

        mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        CreateAnimalRequest req2 = CreateAnimalRequest.builder()
                .name("Duplicate Willow")
                .tag("C-DUP-01")
                .breed("Sahiwal")
                .build();

        mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DUPLICATE_RESOURCE"));
    }

    @Test
    void createAnimal_BirthDateInFuture_ShouldReturnBadRequest() throws Exception {
        CreateAnimalRequest req = CreateAnimalRequest.builder()
                .name("Future Calf")
                .tag("C-FUT-01")
                .breed("Gir")
                .birthDate(LocalDate.now().plusDays(10))
                .build();

        mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Birth date cannot be in the future"));
    }

    @Test
    void createAnimal_AiDateEarlierThanBirthDate_ShouldReturnBadRequest() throws Exception {
        CreateAnimalRequest req = CreateAnimalRequest.builder()
                .name("Time Travel Cow")
                .tag("C-TIME-01")
                .breed("Gir")
                .birthDate(LocalDate.of(2023, 6, 1))
                .aiDate(LocalDate.of(2022, 1, 1)) // Before birth!
                .build();

        mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("AI date cannot be earlier than the animal's birth date"));
    }

    @Test
    void createAnimal_VaccinationDateEarlierThanBirthDate_ShouldReturnBadRequest() throws Exception {
        CreateAnimalRequest req = CreateAnimalRequest.builder()
                .name("Vaccine Calf")
                .tag("C-VAC-01")
                .breed("Gir")
                .birthDate(LocalDate.of(2023, 6, 1))
                .lastVaccinationDate(LocalDate.of(2022, 1, 1)) // Before birth!
                .build();

        mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Last vaccination date cannot be earlier than the animal's birth date"));
    }

    @Test
    void createAnimal_ParentSelfReference_ShouldReturnBadRequest() throws Exception {
        CreateAnimalRequest req = CreateAnimalRequest.builder()
                .name("Self Parent")
                .tag("C-SELF-01")
                .breed("Gir")
                .fatherTag("C-SELF-01") // Same as animal being created
                .build();

        mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Father cannot be the same animal being created"));
    }

    @Test
    void updateAndDeactivateAnimal_ShouldSucceed() throws Exception {
        CreateAnimalRequest createReq = CreateAnimalRequest.builder()
                .name("Ruby")
                .tag("C-RUBY-01")
                .breed("Jersey")
                .weight(BigDecimal.valueOf(500))
                .build();

        MvcResult createRes = mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String animalId = objectMapper.readTree(createRes.getResponse().getContentAsString())
                .get("data").get("id").asText();

        // Update
        UpdateAnimalRequest updateReq = UpdateAnimalRequest.builder()
                .name("Ruby Red")
                .status("Needs check")
                .weight(BigDecimal.valueOf(520))
                .pen("West Pen 2")
                .build();

        mockMvc.perform(put("/api/animals/" + animalId)
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Ruby Red"))
                .andExpect(jsonPath("$.data.status").value("Needs check"))
                .andExpect(jsonPath("$.data.pen").value("West Pen 2"));

        // Add history event
        CreateHistoryEventRequest historyReq = CreateHistoryEventRequest.builder()
                .eventType(HistoryEventType.HEALTH_CHECK)
                .eventDate(LocalDate.now())
                .title("Veterinary Routine Check")
                .detail("Checked hooves and overall condition.")
                .badge("Health")
                .build();

        mockMvc.perform(post("/api/animals/" + animalId + "/history")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(historyReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Veterinary Routine Check"));

        // Soft Delete / Deactivate
        mockMvc.perform(delete("/api/animals/" + animalId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk());

        // Check that active is now false
        mockMvc.perform(get("/api/animals/" + animalId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));
    }
}
