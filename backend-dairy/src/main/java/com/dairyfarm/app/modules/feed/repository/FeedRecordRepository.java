package com.dairyfarm.app.modules.feed.repository;

import com.dairyfarm.app.modules.feed.model.FeedRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface FeedRecordRepository extends JpaRepository<FeedRecord, UUID> {

    List<FeedRecord> findByFarmIdAndRecordDateBetweenOrderByRecordDateDescCreatedAtDesc(
            UUID farmId, LocalDate startDate, LocalDate endDate);

    List<FeedRecord> findByFarmIdOrderByRecordDateDescCreatedAtDesc(UUID farmId);
}
