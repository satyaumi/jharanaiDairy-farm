package com.dairyfarm.app.modules.dataimport.model;

import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "import_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(name = "batch_code", nullable = false, length = 100)
    private String batchCode;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "record_type", nullable = false, length = 50)
    private String recordType; // MILK_RECORD, COW_RECORD, FEED_RECORD, etc.

    @Column(name = "total_rows", nullable = false)
    @Builder.Default
    private Integer totalRows = 0;

    @Column(name = "created_count", nullable = false)
    @Builder.Default
    private Integer createdCount = 0;

    @Column(name = "updated_count", nullable = false)
    @Builder.Default
    private Integer updatedCount = 0;

    @Column(name = "skipped_count", nullable = false)
    @Builder.Default
    private Integer skippedCount = 0;

    @Column(name = "error_count", nullable = false)
    @Builder.Default
    private Integer errorCount = 0;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "COMPLETED";

    @Column(name = "error_log", columnDefinition = "TEXT")
    private String errorLog;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imported_by")
    private User importedBy;

    @Column(name = "imported_by_name", length = 150)
    private String importedByName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
