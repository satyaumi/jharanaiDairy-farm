package com.dairyfarm.app.modules.user.dto;

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
public class CreateWorkerRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 150, message = "Name must be between 2 and 150 characters")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    private String mobileNumber;

    private String email;

    private String department;

    private String jobPosition;

    private String assignedArea;

    private String shift;

    @Builder.Default
    private String employmentStatus = "Full-time";

    private LocalDate joiningDate;

    private String emergencyContact;

    @Builder.Default
    private boolean sendInvitation = true;
}
