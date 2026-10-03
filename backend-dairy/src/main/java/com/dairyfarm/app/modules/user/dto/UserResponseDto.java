package com.dairyfarm.app.modules.user.dto;

import com.dairyfarm.app.modules.user.model.Role;
import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.model.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {

    private UUID id;
    private UUID farmId;
    private String farmName;
    private String fullName;
    private String username;
    private String email;
    private String mobileNumber;
    private Role role;
    private String employeeId;
    private String department;
    private String jobPosition;
    private String assignedArea;
    private String shift;
    private String employmentStatus;
    private UserStatus status;
    private boolean active;
    private boolean verified;
    private LocalDate joiningDate;
    private String emergencyContact;
    private String responsibilities;
    private String avatarUrl;
    private Instant invitationSentAt;
    private boolean invitationPending;
    private String invitationToken;
    private Instant createdAt;

    public static UserResponseDto fromEntity(User user) {
        if (user == null) return null;
        boolean pending = user.getStatus() == UserStatus.PENDING_ACTIVATION || user.getStatus() == UserStatus.INVITED;
        return UserResponseDto.builder()
                .id(user.getId())
                .farmId(user.getFarm() != null ? user.getFarm().getId() : null)
                .farmName(user.getFarm() != null ? user.getFarm().getName() : "")
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .mobileNumber(user.getMobileNumber())
                .role(user.getRole())
                .employeeId(user.getEmployeeId())
                .department(user.getDepartment())
                .jobPosition(user.getJobPosition())
                .assignedArea(user.getAssignedArea())
                .shift(user.getShift())
                .employmentStatus(user.getEmploymentStatus())
                .status(user.getStatus() != null ? user.getStatus() : (user.isActive() ? UserStatus.ACTIVE : UserStatus.INACTIVE))
                .active(user.isActive())
                .verified(user.isVerified())
                .joiningDate(user.getJoiningDate())
                .emergencyContact(user.getEmergencyContact())
                .responsibilities(user.getResponsibilities())
                .avatarUrl(user.getAvatarUrl())
                .invitationSentAt(user.getInvitationSentAt())
                .invitationPending(pending)
                .invitationToken(user.getInvitationToken())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
