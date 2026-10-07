package com.dairyfarm.app.modules.stock.controller;

import com.dairyfarm.app.modules.stock.dto.StockBalanceDto;
import com.dairyfarm.app.modules.stock.dto.StockTransactionDto;
import com.dairyfarm.app.modules.stock.service.StockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
@Tag(name = "Stock Ledger", description = "Endpoints for managing farm inventory and ledger movements")
public class StockController {

    private final StockService stockService;

    @GetMapping
    @Operation(summary = "Get current stock items with calculated balances (Opening + Added - Consumed = Current Stock)")
    public ResponseEntity<Map<String, Object>> getStock() {
        List<StockBalanceDto> items = stockService.getStockBalances();
        return ResponseEntity.ok(Map.of("success", true, "data", items));
    }

    @GetMapping("/transactions")
    @Operation(summary = "Get stock ledger transaction history")
    public ResponseEntity<Map<String, Object>> getTransactions(
            @RequestParam(required = false) UUID stockItemId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        List<StockTransactionDto> list = stockService.getTransactions(stockItemId, fromDate, toDate);
        return ResponseEntity.ok(Map.of("success", true, "data", list));
    }

    @PostMapping("/transactions")
    @Operation(summary = "Record stock movement (RECEIVED, PURCHASE, CONSUMPTION, ADJUSTMENT_IN, ADJUSTMENT_OUT)")
    public ResponseEntity<Map<String, Object>> recordTransaction(@RequestBody Map<String, Object> body) {
        UUID stockItemId = body.get("stockItemId") != null ? UUID.fromString(body.get("stockItemId").toString()) : null;
        UUID feedItemId = body.get("feedItemId") != null ? UUID.fromString(body.get("feedItemId").toString()) : null;
        String itemName = body.get("itemName") != null ? body.get("itemName").toString() : null;
        String type = body.get("transactionType") != null ? body.get("transactionType").toString() : "RECEIVED";

        BigDecimal qty = BigDecimal.ZERO;
        if (body.get("quantity") != null) {
            qty = new BigDecimal(body.get("quantity").toString());
        }

        String unit = body.get("unit") != null ? body.get("unit").toString() : "KG";
        LocalDate date = body.get("transactionDate") != null ? LocalDate.parse(body.get("transactionDate").toString()) : LocalDate.now();
        String refType = body.get("referenceType") != null ? body.get("referenceType").toString() : "MANUAL";
        UUID refId = body.get("referenceId") != null ? UUID.fromString(body.get("referenceId").toString()) : null;
        String notes = body.get("notes") != null ? body.get("notes").toString() : null;

        StockTransactionDto dto = stockService.recordTransaction(
                stockItemId, feedItemId, itemName, type, qty, unit, date, refType, refId, notes
        );

        return new ResponseEntity<>(Map.of("success", true, "data", dto), HttpStatus.CREATED);
    }
}
