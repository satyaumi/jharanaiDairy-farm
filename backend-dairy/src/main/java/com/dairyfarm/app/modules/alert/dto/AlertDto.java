package com.dairyfarm.app.modules.alert.dto;

import com.dairyfarm.app.modules.alert.model.FarmAlert;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertDto {

    private UUID id;
    private String title;
    private String message;
    private String category;
    private String severity; // NORMAL, IMPORTANT, CRITICAL
    private String targetRole; // ALL, WORKER, MANAGEMENT, OWNER
    private UUID targetUserId;
    private UUID animalId;
    private String cowNumber;
    private LocalDate eventDate;
    private LocalDate dueDate;
    private String status;
    private String createdByName;
    private OffsetDateTime createdAt;
    private boolean isRead;

    public static AlertDto fromEntity(FarmAlert a, boolean isRead) {
        return AlertDto.builder()
                .id(a.getId())
                .title(a.getTitle())
                .message(a.getMessage())
                .category(a.getCategory())
                .severity(a.getSeverity())
                .targetRole(a.getTargetRole())
                .targetUserId(a.getTargetUserId())
                .animalId(a.getAnimal() != null ? a.getAnimal().getId() : null)
                .cowNumber(a.getCowNumber() != null ? a.getCowNumber() : (a.getAnimal() != null ? a.getAnimal().getEarTag() : null))
                .eventDate(a.getEventDate())
                .dueDate(a.getDueDate())
                .status(a.getStatus())
                .createdByName(a.getCreatedByName())
                .createdAt(a.getCreatedAt())
                .isRead(isRead)
                .build();
    }
}
