package com.dairyfarm.app.modules.user.dto;

import com.dairyfarm.app.modules.user.model.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStatusRequest {

    @NotNull(message = "Status cannot be null")
    private UserStatus status;
}
