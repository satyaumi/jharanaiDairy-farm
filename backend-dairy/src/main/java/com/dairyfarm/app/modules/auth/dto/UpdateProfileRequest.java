package com.dairyfarm.app.modules.auth.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Size(min = 2, max = 150, message = "Name must be between 2 and 150 characters")
    private String name;

    private String email;

    private String avatarUrl;
}
