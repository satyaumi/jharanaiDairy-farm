package com.dairyfarm.app.modules.alert.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAlertRequest {

    @NotBlank(message = "Alert title is required")
    private String title;

    @NotBlank(message = "Alert message is required")
    private String message;

    private String category; // ANIMAL_HEALTH, PREGNANCY, CALVING, MILK_PRODUCTION, FEED_STOCK, FARM_OPERATIONS, WORKER_NOTICE, OWNER_NOTICE, GENERAL

    private String severity; // NORMAL, IMPORTANT, CRITICAL

    private String targetRole; // ALL, WORKER, MANAGEMENT, OWNER

    private UUID targetUserId;

    private String cowNumber;

    private UUID animalId;

    private LocalDate eventDate;

    private LocalDate dueDate;
}
