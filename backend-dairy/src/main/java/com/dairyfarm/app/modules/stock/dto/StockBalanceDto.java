package com.dairyfarm.app.modules.stock.dto;

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
public class StockBalanceDto {
    private UUID stockItemId;
    private UUID feedItemId;
    private String itemName;
    private String category;
    private String unit;
    private BigDecimal minThreshold;
    private BigDecimal totalAdded;
    private BigDecimal totalConsumed;
    private BigDecimal currentStock;
    private boolean lowStock;
    private String trend; // low, normal, optimal
    private double stockPercent;
}
