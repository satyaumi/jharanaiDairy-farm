package com.dairyfarm.app.modules.animal.dto;

import com.dairyfarm.app.modules.animal.model.LifecycleStatus;
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
public class ChangeLifecycleStatusRequest {

    @NotNull(message = "Lifecycle status is required")
    private LifecycleStatus status;

    private LocalDate effectiveDate;

    private String reason;

    private String notes;
}
