package com.dairyfarm.app.modules.animal.dto;

import com.dairyfarm.app.modules.milk.model.MilkRecord;
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
public class AnimalMilkRecordDto {
    private UUID id;
    private LocalDate recordDate;
    private String shift;
    private BigDecimal litres;
    private String quality;
    private BigDecimal fatPercentage;
    private BigDecimal snfPercentage;
    private String notes;

    public static AnimalMilkRecordDto fromEntity(MilkRecord entity) {
        if (entity == null) return null;
        return AnimalMilkRecordDto.builder()
                .id(entity.getId())
                .recordDate(entity.getRecordDate())
                .shift(entity.getShift())
                .litres(entity.getLitres())
                .quality(entity.getQuality())
                .fatPercentage(entity.getFatPercentage())
                .snfPercentage(entity.getSnfPercentage())
                .notes(entity.getNotes())
                .build();
    }
}
