package com.dairyfarm.app.modules.milk.dto;

import com.dairyfarm.app.modules.milk.model.MilkRecord;
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
public class MilkDto {
    private UUID id;
    private UUID animalId;
    private String animalTag;
    private String animalName;
    private String groupName;
    private LocalDate recordDate;
    private String shift; // Morning, Evening, Afternoon
    private BigDecimal litres;
    private String quality;
    private BigDecimal fatPercentage;
    private BigDecimal snfPercentage;
    private String notes;
    private OffsetDateTime createdAt;

    public static MilkDto fromEntity(MilkRecord r) {
        if (r == null) return null;
        return MilkDto.builder()
                .id(r.getId())
                .animalId(r.getAnimal().getId())
                .animalTag(r.getAnimal().getEarTag())
                .animalName(r.getAnimal().getAnimalName())
                .groupName(r.getAnimal().getGroup() != null ? r.getAnimal().getGroup().getName() : r.getAnimal().getPen())
                .recordDate(r.getRecordDate())
                .shift(r.getShift())
                .litres(r.getLitres())
                .quality(r.getQuality())
                .fatPercentage(r.getFatPercentage())
                .snfPercentage(r.getSnfPercentage())
                .notes(r.getNotes())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
