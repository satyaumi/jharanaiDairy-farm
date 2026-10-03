package com.dairyfarm.app.modules.user.dto;

import com.dairyfarm.app.modules.user.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationInfoDto {

    private boolean valid;
    private String name;
    private String username;
    private Role role;
    private String farmName;
    private String message;
}
