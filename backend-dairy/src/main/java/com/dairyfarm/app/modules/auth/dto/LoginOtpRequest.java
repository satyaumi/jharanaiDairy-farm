package com.dairyfarm.app.modules.auth.dto;

import com.dairyfarm.app.modules.user.model.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginOtpRequest {

    @NotBlank(message = "Phone number or email is required")
    private String phoneOrEmail;

    @NotBlank(message = "Verification code is required")
    private String otp;

    private Role requestedRole;
}
