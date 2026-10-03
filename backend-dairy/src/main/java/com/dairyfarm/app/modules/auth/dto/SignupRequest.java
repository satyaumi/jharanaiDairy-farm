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
public class SignupRequest {

    @NotBlank(message = "Full name is required")
    private String name;

    @NotBlank(message = "Mobile number is required")
    private String phone;

    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Farm name is required")
    private String farmName;

    @Builder.Default
    private Role role = Role.OWNER;
}
