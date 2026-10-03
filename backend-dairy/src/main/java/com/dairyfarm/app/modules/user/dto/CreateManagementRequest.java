package com.dairyfarm.app.modules.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateManagementRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 150, message = "Name must be between 2 and 150 characters")
    private String fullName;

    @NotBlank(message = "Email is required for management staff")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String mobileNumber;

    private String department;

    private String jobPosition;

    private String responsibilities;

    @Builder.Default
    private String employmentStatus = "Full-time";

    private LocalDate joiningDate;

    @Builder.Default
    private boolean sendInvitation = true;
}
