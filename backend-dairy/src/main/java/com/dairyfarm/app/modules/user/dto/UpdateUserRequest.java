package com.dairyfarm.app.modules.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    private String fullName;
    private String email;
    private String mobileNumber;
    private String department;
    private String jobPosition;
    private String assignedArea;
    private String shift;
    private String employmentStatus;
    private LocalDate joiningDate;
    private String emergencyContact;
    private String responsibilities;
}
