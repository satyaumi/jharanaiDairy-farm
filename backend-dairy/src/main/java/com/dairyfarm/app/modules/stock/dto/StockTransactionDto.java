package com.dairyfarm.app.modules.stock.dto;

import com.dairyfarm.app.modules.stock.model.StockTransaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransactionDto {
    private UUID id;
    private UUID stockItemId;
    private String itemName;
    private String transactionType; // RECEIVED, PURCHASE, CONSUMPTION, OPENING, ADJUSTMENT_IN, ADJUSTMENT_OUT, WASTE
    private BigDecimal quantity;
    private String unit;
    private LocalDate transactionDate;
    private String referenceType;
    private UUID referenceId;
    private String notes;
    private String recordedByName;
    private OffsetDateTime createdAt;

    public static StockTransactionDto fromEntity(StockTransaction tx) {
        if (tx == null) return null;
        return StockTransactionDto.builder()
                .id(tx.getId())
                .stockItemId(tx.getStockItem().getId())
                .itemName(tx.getStockItem().getItemName())
                .transactionType(tx.getTransactionType())
                .quantity(tx.getQuantity())
                .unit(tx.getUnit())
                .transactionDate(tx.getTransactionDate())
                .referenceType(tx.getReferenceType())
                .referenceId(tx.getReferenceId())
                .notes(tx.getNotes())
                .recordedByName(tx.getRecordedByName())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
