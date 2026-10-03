package com.dairyfarm.app.modules.auth;

import com.dairyfarm.app.modules.auth.dto.LoginRequest;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void signup_ShouldCreateFarmAndUser_AndReturnToken() throws Exception {
        SignupRequest signup = SignupRequest.builder()
                .name("Arun Verma")
                .phone("+91 99999 11111")
                .email("arun@vermafarms.com")
                .password("Password@123")
                .farmName("Verma Organic Dairy")
                .role(Role.OWNER)
                .build();

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signup)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.name").value("Arun Verma"))
                .andExpect(jsonPath("$.user.phone").value("+91 99999 11111"))
                .andExpect(jsonPath("$.user.farmName").value("Verma Organic Dairy"));
    }

    @Test
    void login_WithInvalidCredentials_ShouldReturnUnauthorized() throws Exception {
        LoginRequest login = LoginRequest.builder()
                .phoneOrEmail("unknown@example.com")
                .password("wrongpassword")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getCurrentUser_WithoutToken_ShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authFlow_SignupLoginAndGetCurrentUser_ShouldSucceed() throws Exception {
        // 1. Signup
        SignupRequest signup = SignupRequest.builder()
                .name("Kavita Sharma")
                .phone("+91 98888 22222")
                .email("kavita@greenmeadows.com")
                .password("Secret@123")
                .farmName("Green Meadows Dairy")
                .role(Role.OWNER)
                .build();

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signup)))
                .andExpect(status().isCreated());

        // 2. Login
        LoginRequest login = LoginRequest.builder()
                .phoneOrEmail("+91 98888 22222")
                .password("Secret@123")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseBody).get("token").asText();
        assertThat(token).isNotBlank();

        // 3. Get Current User using Bearer Token
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Kavita Sharma"))
                .andExpect(jsonPath("$.phone").value("+91 98888 22222"))
                .andExpect(jsonPath("$.farmName").value("Green Meadows Dairy"));
    }
}
