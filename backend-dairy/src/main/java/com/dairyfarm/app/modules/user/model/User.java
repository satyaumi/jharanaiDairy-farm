package com.dairyfarm.app.modules.user.model;

import com.dairyfarm.app.common.audit.AuditableEntity;
import com.dairyfarm.app.modules.farm.model.Farm;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(unique = true, length = 100)
    private String username;

    @Column(length = 150)
    private String email;

    @Column(name = "mobile_number", nullable = false, length = 50)
    private String mobileNumber;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Role role;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean verified = false;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "employee_id", length = 50)
    private String employeeId;

    @Column(length = 100)
    private String department;

    @Column(name = "job_position", length = 100)
    private String jobPosition;

    @Column(name = "assigned_area", length = 100)
    private String assignedArea;

    @Column(length = 50)
    private String shift;

    @Builder.Default
    @Column(name = "employment_status", length = 50)
    private String employmentStatus = "Full-time";

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "joining_date")
    private java.time.LocalDate joiningDate;

    @Column(name = "emergency_contact", length = 50)
    private String emergencyContact;

    @Column(columnDefinition = "TEXT")
    private String responsibilities;

    @Column(name = "invitation_token", length = 255)
    private String invitationToken;

    @Column(name = "invitation_token_expiry")
    private java.time.Instant invitationTokenExpiry;

    @Column(name = "invitation_sent_at")
    private java.time.Instant invitationSentAt;
}
