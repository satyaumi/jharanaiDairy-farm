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
public class SendLoginOtpRequest {

    @NotBlank(message = "Phone number or email is required")
    private String phoneOrEmail;

    private Role requestedRole;
}
