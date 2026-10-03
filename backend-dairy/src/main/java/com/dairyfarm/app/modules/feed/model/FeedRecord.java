package com.dairyfarm.app.modules.feed.model;

import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.farm.model.Farm;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "feed_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id")
    private Animal animal;

    @Column(name = "feed_type", nullable = false, length = 100)
    private String feedType;

    @Column(name = "group_name", nullable = false, length = 100)
    @Builder.Default
    private String groupName = "Milking herd";

    @Column(name = "quantity_kg", nullable = false, precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal quantityKg = BigDecimal.ZERO;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "recorded_by", length = 100)
    private String recordedBy;

    @Column(name = "source_type", length = 50)
    @Builder.Default
    private String sourceType = "MANUAL";

    @Column(name = "import_batch_id")
    private UUID importBatchId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "created_by")
    private UUID createdBy;
}
