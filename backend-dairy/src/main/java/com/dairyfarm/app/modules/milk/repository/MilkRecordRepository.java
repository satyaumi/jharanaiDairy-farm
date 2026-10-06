package com.dairyfarm.app.modules.milk.repository;

import com.dairyfarm.app.modules.milk.model.MilkRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MilkRecordRepository extends JpaRepository<MilkRecord, UUID> {

    Optional<MilkRecord> findByFarmIdAndAnimalIdAndRecordDateAndShift(
            UUID farmId, UUID animalId, LocalDate recordDate, String shift);

    List<MilkRecord> findByFarmIdAndRecordDateBetweenOrderByRecordDateDescCreatedAtDesc(
            UUID farmId, LocalDate startDate, LocalDate endDate);

    List<MilkRecord> findByFarmIdAndAnimalIdOrderByRecordDateDescCreatedAtDesc(UUID farmId, UUID animalId);

    List<MilkRecord> findByFarmIdOrderByRecordDateDescCreatedAtDesc(UUID farmId);

    @Query("SELECT r FROM MilkRecord r JOIN FETCH r.animal WHERE r.farm.id = :farmId AND r.recordDate BETWEEN :startDate AND :endDate ORDER BY r.recordDate DESC, r.shift ASC")
    List<MilkRecord> findRecordsWithAnimalForExport(
            @Param("farmId") UUID farmId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
