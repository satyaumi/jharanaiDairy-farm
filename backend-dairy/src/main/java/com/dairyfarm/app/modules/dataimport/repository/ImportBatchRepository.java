package com.dairyfarm.app.modules.dataimport.repository;

import com.dairyfarm.app.modules.dataimport.model.ImportBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ImportBatchRepository extends JpaRepository<ImportBatch, UUID> {

    List<ImportBatch> findByFarmIdOrderByCreatedAtDesc(UUID farmId);

    Optional<ImportBatch> findByFarmIdAndBatchCode(UUID farmId, String batchCode);
}
