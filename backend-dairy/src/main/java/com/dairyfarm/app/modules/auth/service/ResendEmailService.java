package com.dairyfarm.app.modules.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ResendEmailService {

    private final String resendApiKey;
    private final String fromEmail;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ResendEmailService(
            @Value("${resend.api-key:${RESEND_API_KEY:}}") String resendApiKey,
            @Value("${resend.from-email:${RESEND_FROM_EMAIL:Jharanai Farm <onboarding@resend.dev>}}") String fromEmail,
            ObjectMapper objectMapper
    ) {
        this.resendApiKey = resendApiKey != null ? resendApiKey.trim() : "";
        this.fromEmail = fromEmail != null && !fromEmail.isBlank() ? fromEmail.trim() : "Jharanai Farm <onboarding@resend.dev>";
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        if (this.resendApiKey.isEmpty()) {
            log.warn("Resend API key is not configured. Outgoing authentication emails will be logged locally as fallbacks.");
        } else {
            log.info("Resend Email Service initialized with sender: {}", this.fromEmail);
        }
    }

    public boolean isConfigured() {
        return !resendApiKey.isEmpty();
    }

    /**
     * Send professional branded OTP verification email
     */
    public boolean sendOtpEmail(String toEmail, String otpCode, String purpose, int validityMinutes) {
        if (toEmail == null || !toEmail.contains("@")) {
            log.warn("Invalid recipient email provided for OTP: {}", toEmail);
            return false;
        }

        String subject = "Your Jharanai Farm Verification Code: " + otpCode;
        String actionLabel = "PASSWORD_RESET".equalsIgnoreCase(purpose)
                ? "reset your account password"
                : "verify your farm account";

        String htmlBody = buildOtpHtmlTemplate(otpCode, actionLabel, validityMinutes);
        String textBody = "Your Jharanai Farm verification code is: " + otpCode + "\n\n"
                + "Use this code to " + actionLabel + ". This code expires in " + validityMinutes + " minutes.\n"
                + "Do not share this code with anyone. If you did not request this, please ignore this email.";

        return sendEmail(toEmail, subject, htmlBody, textBody);
    }

    /**
     * Core email dispatch through Resend REST API
     */
    public boolean sendEmail(String toEmail, String subject, String htmlContent, String textContent) {
        if (!isConfigured()) {
            log.info("Resend not configured: Mock email delivered to {} with subject '{}'", toEmail, subject);
            return true;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("from", fromEmail);
            payload.put("to", List.of(toEmail));
            payload.put("subject", subject);
            payload.put("html", htmlContent);
            payload.put("text", textContent);

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email delivered via Resend to {} [status: {}]", toEmail, response.statusCode());
                return true;
            } else {
                log.error("Resend API rejected email to {} [status: {}, response: {}]",
                        toEmail, response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to send email via Resend to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    /**
     * Responsive, clean HTML email template
     */
    private String buildOtpHtmlTemplate(String otpCode, String actionLabel, int validityMinutes) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Jharanai Farm Verification</title>
              <style>
                body { margin: 0; padding: 0; background-color: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                .wrapper { width: 100%%; max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
                .header { background: linear-gradient(135deg, #059669 0%%, #047857 100%%); padding: 32px 24px; text-align: center; color: #ffffff; }
                .brand-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
                .brand-sub { font-size: 13px; opacity: 0.9; margin-top: 4px; font-weight: 500; }
                .content { padding: 36px 32px; color: #1e293b; line-height: 1.6; }
                .greeting { font-size: 17px; font-weight: 700; margin-top: 0; color: #0f172a; }
                .instruction { font-size: 14px; color: #475569; margin-bottom: 24px; }
                .otp-box { background: #f8fafc; border: 2px dashed #10b981; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0; }
                .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #065f46; font-family: 'Courier New', Courier, monospace; display: inline-block; }
                .expiry-note { font-size: 12px; color: #64748b; margin-top: 10px; font-weight: 600; }
                .warning-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; font-size: 12px; color: #991b1b; margin-top: 24px; }
                .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <div class="header">
                  <h1 class="brand-title">Jharanai Farm</h1>
                  <p class="brand-sub">Commercial Dairy Operations & Security</p>
                </div>
                <div class="content">
                  <p class="greeting">Hello,</p>
                  <p class="instruction">
                    You recently requested a security verification code to %s.
                    Please enter the code below to complete this action:
                  </p>
                  <div class="otp-box">
                    <span class="otp-code">%s</span>
                    <p class="expiry-note">⏱ This code is valid for %d minutes</p>
                  </div>
                  <div class="warning-box">
                    <strong>Security Warning:</strong> Never share this code with anyone. Jharanai Farm staff will never ask for your verification code.
                  </div>
                </div>
                <div class="footer">
                  &copy; %s Jharanai Dairy Farm. All operational rights reserved.<br>
                  This is an automated operational security message. Please do not reply.
                </div>
              </div>
            </body>
            </html>
            """.formatted(actionLabel, otpCode, validityMinutes, java.time.Year.now().toString());
    }
}
