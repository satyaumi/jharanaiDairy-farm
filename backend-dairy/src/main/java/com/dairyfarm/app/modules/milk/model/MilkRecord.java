package com.dairyfarm.app.modules.milk.model;

import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.farm.model.Farm;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "milk_records", uniqueConstraints = {
    @UniqueConstraint(name = "uk_milk_record_shift", columnNames = {"farm_id", "animal_id", "record_date", "shift"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MilkRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "shift", nullable = false, length = 20)
    private String shift; // Morning, Evening, Afternoon

    @Column(name = "litres", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal litres = BigDecimal.ZERO;

    @Column(name = "quality", length = 50)
    @Builder.Default
    private String quality = "Normal";

    @Column(name = "fat_percentage", precision = 4, scale = 2)
    private BigDecimal fatPercentage;

    @Column(name = "snf_percentage", precision = 4, scale = 2)
    private BigDecimal snfPercentage;

    @Column(name = "source_type", length = 50)
    @Builder.Default
    private String sourceType = "MANUAL"; // MANUAL, IMPORT, SENSOR

    @Column(name = "import_batch_id")
    private UUID importBatchId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;
}
