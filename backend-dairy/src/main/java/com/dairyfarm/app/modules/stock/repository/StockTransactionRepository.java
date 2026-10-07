package com.dairyfarm.app.modules.stock.repository;

import com.dairyfarm.app.modules.stock.model.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, UUID> {
    List<StockTransaction> findByFarmIdOrderByTransactionDateDescCreatedAtDesc(UUID farmId);
    List<StockTransaction> findByFarmIdAndStockItemIdOrderByTransactionDateDescCreatedAtDesc(UUID farmId, UUID stockItemId);
    List<StockTransaction> findByFarmIdAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(UUID farmId, LocalDate start, LocalDate end);
    List<StockTransaction> findByStockItemId(UUID stockItemId);
}
