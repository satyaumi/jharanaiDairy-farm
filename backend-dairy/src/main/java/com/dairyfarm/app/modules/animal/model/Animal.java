package com.dairyfarm.app.modules.animal.model;

import com.dairyfarm.app.common.audit.AuditableEntity;
import com.dairyfarm.app.modules.farm.model.Farm;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "animals", uniqueConstraints = {
        @UniqueConstraint(name = "uk_animal_farm_ear_tag", columnNames = {"farm_id", "ear_tag"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Animal extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private AnimalGroup group;

    @Column(name = "animal_name", length = 100)
    private String animalName;

    @Column(name = "ear_tag", nullable = false, length = 100)
    private String earTag;

    @Column(nullable = false, length = 100)
    private String breed;

    @Enumerated(EnumType.STRING)
    @Column(name = "animal_type", nullable = false, length = 50)
    @Builder.Default
    private AnimalType animalType = AnimalType.Lactating;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "Healthy";

    @Column(length = 50)
    private String age;

    @Column(precision = 7, scale = 2)
    @Builder.Default
    private BigDecimal weight = BigDecimal.ZERO;

    @Column(name = "yield", precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal milkYield = BigDecimal.ZERO;

    @Column(length = 100)
    private String pen;

    @Column(name = "lactation_cycle")
    @Builder.Default
    private Integer lactationCycle = 1;

    @Column(name = "feed_ration")
    private String feedRation;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "birth_status", length = 100)
    private String birthStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "father_animal_id")
    private Animal father;

    @Column(name = "father_tag", length = 100)
    private String fatherTag;

    @Column(name = "father_name", length = 100)
    private String fatherName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mother_animal_id")
    private Animal mother;

    @Column(name = "mother_tag", length = 100)
    private String motherTag;

    @Column(name = "mother_name", length = 100)
    private String motherName;

    @Column(name = "ai_date")
    private LocalDate aiDate;

    @Column(name = "last_vaccination_date")
    private LocalDate lastVaccinationDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "last_milking_date")
    private Instant lastMilkingDate;

    @Column(name = "last_health_check")
    private LocalDate lastHealthCheck;

    @Enumerated(EnumType.STRING)
    @Column(name = "lifecycle_status", nullable = false, length = 50)
    @Builder.Default
    private LifecycleStatus lifecycleStatus = LifecycleStatus.ACTIVE;

    @Column(name = "lifecycle_date")
    private LocalDate lifecycleDate;

    @Column(name = "lifecycle_reason", length = 255)
    private String lifecycleReason;

    @Column(name = "lifecycle_notes", columnDefinition = "TEXT")
    private String lifecycleNotes;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "animal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("eventDate DESC")
    @Builder.Default
    private List<AnimalHistory> historyList = new ArrayList<>();
}
