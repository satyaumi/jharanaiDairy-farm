package com.dairyfarm.app.modules.stock.repository;

import com.dairyfarm.app.modules.stock.model.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockItemRepository extends JpaRepository<StockItem, UUID> {
    List<StockItem> findByFarmIdAndActiveTrueOrderByItemNameAsc(UUID farmId);
    List<StockItem> findByFarmIdOrderByItemNameAsc(UUID farmId);
    Optional<StockItem> findByIdAndFarmId(UUID id, UUID farmId);
    Optional<StockItem> findByFarmIdAndFeedItemId(UUID farmId, UUID feedItemId);
    Optional<StockItem> findByFarmIdAndItemName(UUID farmId, String itemName);
    boolean existsByFarmIdAndItemName(UUID farmId, String itemName);
    boolean existsByFarmIdAndItemNameAndIdNot(UUID farmId, String itemName, UUID id);
}
