package com.dairyfarm.app.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "Phone number or email is required")
    private String phoneOrEmail;

    @NotBlank(message = "Verification code is required")
    private String otp;

    @NotBlank(message = "New password is required")
    private String newPassword;
}
