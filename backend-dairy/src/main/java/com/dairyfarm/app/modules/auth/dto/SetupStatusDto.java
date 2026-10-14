package com.dairyfarm.app.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetupStatusDto {
    private boolean managementSetupAvailable;
    private boolean systemInitialized;
    private String message;
}
