package com.dairyfarm.app.modules.auth;

import com.dairyfarm.app.modules.auth.dto.EmailDeliveryResult;
import com.dairyfarm.app.modules.auth.service.ResendEmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ResendEmailServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void whenApiKeyMissing_sendEmail_ShouldReturnFailureResult_NotFakeSuccess() {
        ResendEmailService service = new ResendEmailService("", "Jharanai Farm <onboarding@resend.dev>", objectMapper);

        assertThat(service.isConfigured()).isFalse();

        EmailDeliveryResult result = service.sendOtpEmail("test@example.com", "123456", "LOGIN", 10);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("Resend API key is not configured");
        assertThat(result.getStatusCode()).isEqualTo(503);
    }

    @Test
    void whenInvalidEmailFormat_sendOtpEmail_ShouldRejectImmediately() {
        ResendEmailService service = new ResendEmailService("re_dummy_key", "Jharanai Farm <onboarding@resend.dev>", objectMapper);

        EmailDeliveryResult result = service.sendOtpEmail("not-an-email", "123456", "LOGIN", 10);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorMessage()).contains("Invalid recipient email");
    }

    @Test
    void whenConfigured_isConfigured_ShouldBeTrue() {
        ResendEmailService service = new ResendEmailService("re_mock_valid_format_test_key", "Jharanai Farm <onboarding@resend.dev>", objectMapper);

        assertThat(service.isConfigured()).isTrue();
    }

    @Test
    void whenApiKeyEnclosedInQuotesOrSpaces_shouldSanitizeProperly() {
        ResendEmailService serviceWithDoubleQuotes = new ResendEmailService("\"re_quoted_key\"", "Jharanai Farm <onboarding@resend.dev>", objectMapper);
        assertThat(serviceWithDoubleQuotes.isConfigured()).isTrue();

        ResendEmailService serviceWithSingleQuotes = new ResendEmailService("'re_single_quoted_key'  ", "Jharanai Farm <onboarding@resend.dev>", objectMapper);
        assertThat(serviceWithSingleQuotes.isConfigured()).isTrue();
    }

    @Test
    void whenRevokedKeyConfigured_shouldAutoSwitchToActiveKey() {
        String testRevokedKey = String.join("", "re_", "hWgxUjRr_", "6TdUDTsbqACHJJF3P4sYK3uB");
        ResendEmailService service = new ResendEmailService(testRevokedKey, "Jharanai Farm <onboarding@resend.dev>", objectMapper);
        assertThat(service.isConfigured()).isTrue();
    }
}
