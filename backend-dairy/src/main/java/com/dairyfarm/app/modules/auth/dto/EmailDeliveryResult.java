package com.dairyfarm.app.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailDeliveryResult {

    private boolean success;
    private String messageId;
    private Integer statusCode;
    private String errorMessage;
    private String recipient;
    @Builder.Default
    private boolean sandboxFallback = false;
    private String fallbackRecipient;
    private String otpCode;

    public static EmailDeliveryResult success(String messageId, String recipient) {
        return EmailDeliveryResult.builder()
                .success(true)
                .messageId(messageId)
                .statusCode(200)
                .recipient(recipient)
                .build();
    }

    public static EmailDeliveryResult sandboxSuccess(String messageId, String recipient, String fallbackRecipient, String otpCode) {
        return EmailDeliveryResult.builder()
                .success(true)
                .sandboxFallback(true)
                .messageId(messageId)
                .statusCode(200)
                .recipient(recipient)
                .fallbackRecipient(fallbackRecipient)
                .otpCode(otpCode)
                .build();
    }

    public static EmailDeliveryResult failure(String errorMessage, Integer statusCode, String recipient) {
        return EmailDeliveryResult.builder()
                .success(false)
                .statusCode(statusCode)
                .errorMessage(errorMessage)
                .recipient(recipient)
                .build();
    }
}
