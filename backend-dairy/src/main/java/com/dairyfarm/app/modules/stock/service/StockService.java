package com.dairyfarm.app.modules.stock.service;

import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.exception.BadRequestException;
import com.dairyfarm.app.common.exception.ResourceNotFoundException;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import com.dairyfarm.app.modules.feed.model.FeedItem;
import com.dairyfarm.app.modules.feed.repository.FeedItemRepository;
import com.dairyfarm.app.modules.stock.dto.StockBalanceDto;
import com.dairyfarm.app.modules.stock.dto.StockTransactionDto;
import com.dairyfarm.app.modules.stock.model.StockItem;
import com.dairyfarm.app.modules.stock.model.StockTransaction;
import com.dairyfarm.app.modules.stock.repository.StockItemRepository;
import com.dairyfarm.app.modules.stock.repository.StockTransactionRepository;
import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
public class StockService {

    private final StockItemRepository stockItemRepository;
    private final StockTransactionRepository transactionRepository;
    private final FeedItemRepository feedItemRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;

    public StockService(
            StockItemRepository stockItemRepository,
            StockTransactionRepository transactionRepository,
            FeedItemRepository feedItemRepository,
            FarmRepository farmRepository,
            UserRepository userRepository
    ) {
        this.stockItemRepository = stockItemRepository;
        this.transactionRepository = transactionRepository;
        this.feedItemRepository = feedItemRepository;
        this.farmRepository = farmRepository;
        this.userRepository = userRepository;
    }

    private UUID getTenantFarmId() {
        UUID farmId = TenantContext.getFarmId();
        if (farmId == null) {
            return UUID.fromString("a0000000-0000-0000-0000-000000000001");
        }
        return farmId;
    }

    /**
     * Compute current stock balances strictly from the stock ledger movements.
     * Opening + Added - Consumed = Current Stock.
     */
    @Transactional(readOnly = true)
    public List<StockBalanceDto> getStockBalances() {
        UUID farmId = getTenantFarmId();
        List<StockItem> items = stockItemRepository.findByFarmIdAndActiveTrueOrderByItemNameAsc(farmId);
        List<StockTransaction> allTransactions = transactionRepository.findByFarmIdOrderByTransactionDateDescCreatedAtDesc(farmId);

        Map<UUID, List<StockTransaction>> txByItem = new HashMap<>();
        for (StockTransaction tx : allTransactions) {
            txByItem.computeIfAbsent(tx.getStockItem().getId(), k -> new ArrayList<>()).add(tx);
        }

        List<StockBalanceDto> results = new ArrayList<>();
        for (StockItem item : items) {
            List<StockTransaction> txs = txByItem.getOrDefault(item.getId(), Collections.emptyList());

            BigDecimal totalAdded = BigDecimal.ZERO;
            BigDecimal totalConsumed = BigDecimal.ZERO;

            for (StockTransaction tx : txs) {
                String type = tx.getTransactionType() != null ? tx.getTransactionType().toUpperCase() : "";
                BigDecimal qty = tx.getQuantity() != null ? tx.getQuantity() : BigDecimal.ZERO;

                if ("OPENING".equals(type) || "PURCHASE".equals(type) || "RECEIVED".equals(type) || "ADJUSTMENT_IN".equals(type) || "SUPPLY".equals(type) || "ADD".equals(type)) {
                    totalAdded = totalAdded.add(qty);
                } else if ("CONSUMPTION".equals(type) || "ADJUSTMENT_OUT".equals(type) || "WASTE".equals(type) || "FEEDING".equals(type) || "CONSUME".equals(type)) {
                    totalConsumed = totalConsumed.add(qty);
                }
            }

            BigDecimal currentStock = totalAdded.subtract(totalConsumed);
            if (currentStock.compareTo(BigDecimal.ZERO) < 0) {
                currentStock = BigDecimal.ZERO;
            }

            BigDecimal threshold = item.getMinThreshold() != null ? item.getMinThreshold() : BigDecimal.ZERO;
            boolean lowStock = threshold.compareTo(BigDecimal.ZERO) > 0 && currentStock.compareTo(threshold) <= 0;

            double percent = 100.0;
            if (totalAdded.compareTo(BigDecimal.ZERO) > 0) {
                percent = currentStock.multiply(BigDecimal.valueOf(100))
                        .divide(totalAdded, 1, RoundingMode.HALF_UP)
                        .doubleValue();
            } else if (currentStock.compareTo(BigDecimal.ZERO) == 0) {
                percent = 0.0;
            }

            String trend = lowStock ? "low" : (percent >= 50.0 ? "optimal" : "normal");

            results.add(StockBalanceDto.builder()
                    .stockItemId(item.getId())
                    .feedItemId(item.getFeedItem() != null ? item.getFeedItem().getId() : null)
                    .itemName(item.getItemName())
                    .category(item.getCategory())
                    .unit(item.getUnit())
                    .minThreshold(threshold)
                    .totalAdded(totalAdded)
                    .totalConsumed(totalConsumed)
                    .currentStock(currentStock)
                    .lowStock(lowStock)
                    .trend(trend)
                    .stockPercent(Math.min(100.0, percent))
                    .build());
        }

        return results;
    }

    @Transactional(readOnly = true)
    public List<StockTransactionDto> getTransactions(UUID stockItemId, LocalDate fromDate, LocalDate toDate) {
        UUID farmId = getTenantFarmId();
        List<StockTransaction> list;
        if (stockItemId != null) {
            list = transactionRepository.findByFarmIdAndStockItemIdOrderByTransactionDateDescCreatedAtDesc(farmId, stockItemId);
        } else if (fromDate != null && toDate != null) {
            list = transactionRepository.findByFarmIdAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(farmId, fromDate, toDate);
        } else {
            list = transactionRepository.findByFarmIdOrderByTransactionDateDescCreatedAtDesc(farmId);
        }

        return list.stream().map(StockTransactionDto::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public BigDecimal getAvailableStock(UUID farmId, UUID stockItemId) {
        List<StockTransaction> txs = transactionRepository.findByFarmIdAndStockItemIdOrderByTransactionDateDescCreatedAtDesc(farmId, stockItemId);
        BigDecimal totalAdded = BigDecimal.ZERO;
        BigDecimal totalConsumed = BigDecimal.ZERO;

        for (StockTransaction tx : txs) {
            String type = tx.getTransactionType() != null ? tx.getTransactionType().toUpperCase() : "";
            BigDecimal qty = tx.getQuantity() != null ? tx.getQuantity() : BigDecimal.ZERO;

            if ("OPENING".equals(type) || "PURCHASE".equals(type) || "RECEIVED".equals(type) || "ADJUSTMENT_IN".equals(type) || "SUPPLY".equals(type) || "ADD".equals(type)) {
                totalAdded = totalAdded.add(qty);
            } else if ("CONSUMPTION".equals(type) || "ADJUSTMENT_OUT".equals(type) || "WASTE".equals(type) || "FEEDING".equals(type) || "CONSUME".equals(type)) {
                totalConsumed = totalConsumed.add(qty);
            }
        }

        BigDecimal balance = totalAdded.subtract(totalConsumed);
        return balance.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : balance;
    }

    /**
     * Record a stock ledger movement (PURCHASE, RECEIVED, CONSUMPTION, ADJUSTMENT_IN, ADJUSTMENT_OUT).
     */
    @Transactional
    public StockTransactionDto recordTransaction(
            UUID stockItemId,
            UUID feedItemId,
            String itemName,
            String transactionType,
            BigDecimal quantity,
            String unit,
            LocalDate transactionDate,
            String referenceType,
            UUID referenceId,
            String notes
    ) {
        UUID farmId = getTenantFarmId();
        UUID currentUserId = TenantContext.getUserId();
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Transaction quantity must be greater than zero");
        }

        // Idempotency: prevent double-deducting or duplicate ledger entries on retries
        if (referenceId != null && referenceType != null) {
            Optional<StockTransaction> existing = transactionRepository
                    .findFirstByFarmIdAndReferenceTypeAndReferenceId(farmId, referenceType, referenceId);
            if (existing.isPresent()) {
                log.info("Stock transaction already recorded for reference {}/{}, returning existing transaction",
                        referenceType, referenceId);
                return StockTransactionDto.fromEntity(existing.get());
            }
        }

        StockItem item = null;
        if (stockItemId != null) {
            item = stockItemRepository.findByIdAndFarmId(stockItemId, farmId).orElse(null);
        }
        if (item == null && feedItemId != null) {
            item = stockItemRepository.findByFarmIdAndFeedItemId(farmId, feedItemId).orElse(null);
            if (item == null) {
                FeedItem feed = feedItemRepository.findByIdAndFarmId(feedItemId, farmId).orElse(null);
                if (feed != null) {
                    item = stockItemRepository.save(StockItem.builder()
                            .farm(farm)
                            .feedItem(feed)
                            .itemName(feed.getDisplayName())
                            .category("FEED")
                            .unit(feed.getUnit())
                            .minThreshold(BigDecimal.valueOf(50))
                            .active(true)
                            .build());
                }
            }
        }
        if (item == null && itemName != null && !itemName.isBlank()) {
            item = stockItemRepository.findByFarmIdAndItemName(farmId, itemName.trim()).orElse(null);
            if (item == null) {
                item = stockItemRepository.save(StockItem.builder()
                        .farm(farm)
                        .itemName(itemName.trim())
                        .category("FEED")
                        .unit(unit != null ? unit : "KG")
                        .minThreshold(BigDecimal.valueOf(50))
                        .active(true)
                        .build());
            }
        }

        if (item == null) {
            List<StockItem> existing = stockItemRepository.findByFarmIdAndCategory(farmId, "FEED");
            if (!existing.isEmpty()) {
                item = existing.get(0);
            } else {
                item = stockItemRepository.save(StockItem.builder()
                        .farm(farm)
                        .itemName((itemName != null && !itemName.isBlank()) ? itemName.trim() : "Dry Straw (Nada)")
                        .category("FEED")
                        .unit(unit != null ? unit : "KG")
                        .minThreshold(BigDecimal.valueOf(50))
                        .active(true)
                        .build());
            }
        }

        // Normalize transaction type to standard ledger movement
        String rawType = transactionType != null ? transactionType.trim().toUpperCase() : "RECEIVED";
        String typeUpper = "RECEIVED";
        if ("SUPPLY".equals(rawType) || "ADD".equals(rawType) || "PURCHASE".equals(rawType)) {
            typeUpper = "RECEIVED";
        } else if ("FEEDING".equals(rawType) || "CONSUME".equals(rawType) || "CONSUMPTION".equals(rawType)) {
            typeUpper = "CONSUMPTION";
        } else if ("OPENING".equals(rawType) || "ADJUSTMENT_IN".equals(rawType) || "ADJUSTMENT_OUT".equals(rawType) || "WASTE".equals(rawType)) {
            typeUpper = rawType;
        }

        if ("CONSUMPTION".equals(typeUpper) || "ADJUSTMENT_OUT".equals(typeUpper) || "WASTE".equals(rawType)) {
            BigDecimal available = getAvailableStock(farmId, item.getId());
            if (available.compareTo(quantity.abs()) < 0) {
                throw new BadRequestException(String.format(
                        "Insufficient stock for %s. Current available: %s %s, requested deduction: %s %s",
                        item.getItemName(), available, item.getUnit(), quantity.abs(), item.getUnit()));
            }
        }

        String recordedByName = currentUser != null ? currentUser.getFullName() : "Farm Team";

        StockTransaction tx = StockTransaction.builder()
                .farm(farm)
                .stockItem(item)
                .transactionType(typeUpper)
                .quantity(quantity.abs())
                .unit(unit != null ? unit : item.getUnit())
                .transactionDate(transactionDate != null ? transactionDate : LocalDate.now())
                .referenceType(referenceType != null ? referenceType : "MANUAL")
                .referenceId(referenceId)
                .notes(notes)
                .recordedByUserId(currentUserId)
                .recordedByName(recordedByName)
                .build();

        StockTransaction saved = transactionRepository.save(tx);
        log.info("Recorded stock transaction {} ({} {} {}) for item {}",
                saved.getId(), saved.getTransactionType(), saved.getQuantity(), saved.getUnit(), item.getItemName());

        return StockTransactionDto.fromEntity(saved);
    }
}
