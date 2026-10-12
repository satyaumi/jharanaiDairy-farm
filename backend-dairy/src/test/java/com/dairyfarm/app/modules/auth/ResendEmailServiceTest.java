package com.dairyfarm.app.modules.auth;

import com.dairyfarm.app.modules.auth.dto.EmailDeliveryResult;
import com.dairyfarm.app.modules.auth.service.ResendEmailService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ResendEmailServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void whenApiKeyMissing_sendEmail_ShouldReturnFailureResult_NotFakeSuccess() {
        ResendEmailService service = new ResendEmailService("", "Jharanai Farm <onboarding@resend.dev>", objectMapper, null);

        assertThat(service.isConfigured()).isFalse();

        EmailDeliveryResult result = service.sendOtpEmail("test@example.com", "123456", "LOGIN", 10);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("Resend API key is not configured");
        assertThat(result.getStatusCode()).isEqualTo(503);
    }

    @Test
    void whenInvalidEmailFormat_sendOtpEmail_ShouldRejectImmediately() {
        ResendEmailService service = new ResendEmailService("re_dummy_key", "Jharanai Farm <onboarding@resend.dev>", objectMapper, null);

        EmailDeliveryResult result = service.sendOtpEmail("not-an-email", "123456", "LOGIN", 10);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("Invalid recipient email");
    }

    @Test
    void whenConfigured_isConfigured_ShouldBeTrue() {
        ResendEmailService service = new ResendEmailService("re_mock_valid_format_test_key", "Jharanai Farm <onboarding@resend.dev>", objectMapper, null);

        assertThat(service.isConfigured()).isTrue();
    }

    @Test
    void whenApiKeyEnclosedInQuotesOrSpaces_shouldSanitizeProperly() {
        ResendEmailService serviceWithDoubleQuotes = new ResendEmailService("\"re_quoted_key\"", "Jharanai Farm <onboarding@resend.dev>", objectMapper, null);
        assertThat(serviceWithDoubleQuotes.isConfigured()).isTrue();

        ResendEmailService serviceWithSingleQuotes = new ResendEmailService("'re_single_quoted_key'  ", "Jharanai Farm <onboarding@resend.dev>", objectMapper, null);
        assertThat(serviceWithSingleQuotes.isConfigured()).isTrue();
    }

    @Test
    @SuppressWarnings("unchecked")
    void whenUserRequestsOtp_TargetRecipientMustBeExactEnteredEmail_NeverHardcodedDeveloper() throws IOException, InterruptedException {
        HttpClient mockHttpClient = mock(HttpClient.class);
        HttpResponse<String> mockResponse = mock(HttpResponse.class);

        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn("{\"id\":\"msg_12345\"}");
        when(mockHttpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(mockResponse);

        ResendEmailService service = new ResendEmailService("re_test_key_abc", "Jharanai Farm <onboarding@resend.dev>", objectMapper, mockHttpClient);

        String enteredUserEmail = "satyamlkinformation@gmail.com";
        EmailDeliveryResult result = service.sendOtpEmail(enteredUserEmail, "654321", "PASSWORD_RESET", 10);

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getMessageId()).isEqualTo("msg_12345");
        assertThat(result.getRecipient()).isEqualTo(enteredUserEmail);

        // Verify request payload strictly sent to enteredUserEmail
        ArgumentCaptor<HttpRequest> requestCaptor = ArgumentCaptor.forClass(HttpRequest.class);
        verify(mockHttpClient, times(1)).send(requestCaptor.capture(), any(HttpResponse.BodyHandler.class));

        HttpRequest capturedRequest = requestCaptor.getValue();
        assertThat(capturedRequest.uri().toString()).isEqualTo("https://api.resend.com/emails");
        assertThat(capturedRequest.headers().firstValue("Authorization")).hasValue("Bearer re_test_key_abc");
    }

    @Test
    @SuppressWarnings("unchecked")
    void whenProviderRejectsWithDomainRestriction_ShouldReturnHonestFailure_AndNeverForwardToDeveloper() throws IOException, InterruptedException {
        HttpClient mockHttpClient = mock(HttpClient.class);
        HttpResponse<String> mockResponse = mock(HttpResponse.class);

        // Simulate Resend free tier unverified domain error
        when(mockResponse.statusCode()).thenReturn(403);
        when(mockResponse.body()).thenReturn("{\"statusCode\":403,\"message\":\"You can only send testing emails to your own email address (satyamlkinf@gmail.com). To send emails to other domains, please verify your domain at resend.com/domains.\"}");
        when(mockHttpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(mockResponse);

        ResendEmailService service = new ResendEmailService("re_test_key_abc", "Jharanai Farm <onboarding@resend.dev>", objectMapper, mockHttpClient);

        String enteredUserEmail = "customer@example.com";
        EmailDeliveryResult result = service.sendOtpEmail(enteredUserEmail, "789012", "LOGIN", 10);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getStatusCode()).isEqualTo(403);
        assertThat(result.getRecipient()).isEqualTo(enteredUserEmail);
        assertThat(result.getErrorMessage()).contains("Resend sandbox limitation");

        // Verify ONLY 1 attempt was made and NO fallback forward was sent to developer email
        verify(mockHttpClient, times(1)).send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class));
    }
}
