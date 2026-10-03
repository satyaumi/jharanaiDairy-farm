package com.dairyfarm.app.modules.animal.dto;

import com.dairyfarm.app.modules.animal.model.AnimalHistory;
import com.dairyfarm.app.modules.animal.model.HistoryEventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnimalHistoryDto {

    private UUID id;
    private UUID animalId;
    private HistoryEventType eventType;
    private LocalDate eventDate;
    private String title;
    private String detail;
    private String badge;
    private Instant createdAt;

    public static AnimalHistoryDto fromEntity(AnimalHistory history) {
        if (history == null) return null;
        return AnimalHistoryDto.builder()
                .id(history.getId())
                .animalId(history.getAnimal().getId())
                .eventType(history.getEventType())
                .eventDate(history.getEventDate())
                .title(history.getTitle())
                .detail(history.getDetail())
                .badge(history.getBadge())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
