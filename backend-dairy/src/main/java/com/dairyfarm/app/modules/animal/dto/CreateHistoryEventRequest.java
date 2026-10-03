package com.dairyfarm.app.modules.animal.dto;

import com.dairyfarm.app.modules.animal.model.HistoryEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateHistoryEventRequest {

    @NotNull(message = "Event type is required")
    private HistoryEventType eventType;

    @NotNull(message = "Event date is required")
    private LocalDate eventDate;

    @NotBlank(message = "Title is required")
    private String title;

    private String detail;
    private String badge;
}
