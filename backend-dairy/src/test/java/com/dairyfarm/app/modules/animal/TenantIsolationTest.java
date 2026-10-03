package com.dairyfarm.app.modules.animal;

import com.dairyfarm.app.modules.animal.dto.CreateAnimalRequest;
import com.dairyfarm.app.modules.auth.dto.SignupRequest;
import com.dairyfarm.app.modules.user.model.Role;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TenantIsolationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void multiTenantIsolation_FarmsCannotAccessEachOtherData_AndSameTagAllowedAcrossFarms() throws Exception {
        // 1. Create Farm A and Owner A
        String idA = UUID.randomUUID().toString().substring(0, 6);
        SignupRequest signupA = SignupRequest.builder()
                .name("Owner A")
                .phone("+91 911" + idA)
                .password("PassA@123")
                .farmName("Farm Alpha " + idA)
                .role(Role.OWNER)
                .build();

        MvcResult resA = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupA)))
                .andExpect(status().isCreated())
                .andReturn();
        String tokenA = objectMapper.readTree(resA.getResponse().getContentAsString()).get("token").asText();

        // 2. Create Farm B and Owner B
        String idB = UUID.randomUUID().toString().substring(0, 6);
        SignupRequest signupB = SignupRequest.builder()
                .name("Owner B")
                .phone("+91 922" + idB)
                .password("PassB@123")
                .farmName("Farm Beta " + idB)
                .role(Role.OWNER)
                .build();

        MvcResult resB = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupB)))
                .andExpect(status().isCreated())
                .andReturn();
        String tokenB = objectMapper.readTree(resB.getResponse().getContentAsString()).get("token").asText();

        // 3. Farm A creates Animal with tag "TAG-X"
        CreateAnimalRequest cowA = CreateAnimalRequest.builder()
                .name("Alpha Cow")
                .tag("TAG-X")
                .breed("Jersey")
                .build();

        MvcResult cowARes = mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cowA)))
                .andExpect(status().isCreated())
                .andReturn();

        String cowAId = objectMapper.readTree(cowARes.getResponse().getContentAsString())
                .get("data").get("id").asText();

        // 4. Farm B creates Animal with SAME tag "TAG-X" -> MUST SUCCEED (Allowed across different farms!)
        CreateAnimalRequest cowB = CreateAnimalRequest.builder()
                .name("Beta Cow")
                .tag("TAG-X")
                .breed("Holstein")
                .build();

        mockMvc.perform(post("/api/animals")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cowB)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Beta Cow"))
                .andExpect(jsonPath("$.data.tag").value("TAG-X"));

        // 5. Farm B user attempts to access Farm A's cow by ID -> MUST RETURN 404 (Tenant Isolation!)
        mockMvc.perform(get("/api/animals/" + cowAId)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());

        // 6. Farm A animal list MUST ONLY contain Farm A animals
        mockMvc.perform(get("/api/animals")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Alpha Cow"));
    }
}
