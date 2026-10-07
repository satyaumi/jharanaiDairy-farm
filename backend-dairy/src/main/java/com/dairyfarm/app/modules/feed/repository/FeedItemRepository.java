package com.dairyfarm.app.modules.feed.repository;

import com.dairyfarm.app.modules.feed.model.FeedItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeedItemRepository extends JpaRepository<FeedItem, UUID> {
    List<FeedItem> findByFarmIdAndActiveTrueOrderByDisplayNameAsc(UUID farmId);
    List<FeedItem> findByFarmIdOrderByDisplayNameAsc(UUID farmId);
    Optional<FeedItem> findByIdAndFarmId(UUID id, UUID farmId);
    Optional<FeedItem> findByFarmIdAndDisplayName(UUID farmId, String displayName);
    boolean existsByFarmIdAndDisplayName(UUID farmId, String displayName);
    boolean existsByFarmIdAndDisplayNameAndIdNot(UUID farmId, String displayName, UUID id);
}
