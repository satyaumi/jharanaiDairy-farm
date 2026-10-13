package com.dairyfarm.app.modules.alert.model;

import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "farm_alerts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 50)
    private String category; // ANIMAL_HEALTH, PREGNANCY, CALVING, MILK_PRODUCTION, FEED_STOCK, FARM_OPERATIONS, WORKER_NOTICE, OWNER_NOTICE, GENERAL

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String severity = "NORMAL"; // NORMAL, IMPORTANT, CRITICAL

    @Column(name = "target_role", nullable = false, length = 50)
    @Builder.Default
    private String targetRole = "ALL"; // ALL, WORKER, MANAGEMENT, OWNER

    @Column(name = "target_user_id")
    private UUID targetUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id")
    private Animal animal;

    @Column(name = "cow_number", length = 50)
    private String cowNumber;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, RESOLVED, DISMISSED

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_by_name", length = 150)
    private String createdByName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
