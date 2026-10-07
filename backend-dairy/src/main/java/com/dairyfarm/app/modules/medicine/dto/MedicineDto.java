package com.dairyfarm.app.modules.medicine.dto;

import com.dairyfarm.app.modules.medicine.model.Medicine;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicineDto {
    private UUID id;
    private String name;
    private String localName;
    private String unit;
    private String batchNumber;
    private LocalDate expiryDate;
    private BigDecimal minThreshold;
    private BigDecimal totalReceived;
    private BigDecimal totalUsed;
    private BigDecimal currentStock;
    private boolean lowStock;
    private String notes;
    private boolean active;

    public static MedicineDto fromEntity(Medicine m, BigDecimal received, BigDecimal used) {
        if (m == null) return null;
        BigDecimal current = received.subtract(used);
        if (current.compareTo(BigDecimal.ZERO) < 0) current = BigDecimal.ZERO;
        boolean low = m.getMinThreshold() != null && m.getMinThreshold().compareTo(BigDecimal.ZERO) > 0
                && current.compareTo(m.getMinThreshold()) <= 0;

        return MedicineDto.builder()
                .id(m.getId())
                .name(m.getName())
                .localName(m.getLocalName())
                .unit(m.getUnit())
                .batchNumber(m.getBatchNumber())
                .expiryDate(m.getExpiryDate())
                .minThreshold(m.getMinThreshold())
                .totalReceived(received)
                .totalUsed(used)
                .currentStock(current)
                .lowStock(low)
                .notes(m.getNotes())
                .active(m.isActive())
                .build();
    }
}
