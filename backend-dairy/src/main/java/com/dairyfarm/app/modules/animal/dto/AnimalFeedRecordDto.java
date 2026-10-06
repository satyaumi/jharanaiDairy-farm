package com.dairyfarm.app.modules.animal.dto;

import com.dairyfarm.app.modules.feed.model.FeedRecord;
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
public class AnimalFeedRecordDto {
    private UUID id;
    private LocalDate recordDate;
    private String feedType;
    private String groupName;
    private BigDecimal quantityKg;
    private String recordedBy;
    private String notes;

    public static AnimalFeedRecordDto fromEntity(FeedRecord entity) {
        if (entity == null) return null;
        return AnimalFeedRecordDto.builder()
                .id(entity.getId())
                .recordDate(entity.getRecordDate())
                .feedType(entity.getFeedType())
                .groupName(entity.getGroupName())
                .quantityKg(entity.getQuantityKg())
                .recordedBy(entity.getRecordedBy())
                .notes(entity.getNotes())
                .build();
    }
}
