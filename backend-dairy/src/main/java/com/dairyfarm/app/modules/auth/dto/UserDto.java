package com.dairyfarm.app.modules.auth.dto;

import com.dairyfarm.app.modules.user.model.Role;
import com.dairyfarm.app.modules.user.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private UUID id;
    private String name;
    private String phone;
    private String email;
    private Role role;
    private String farmName;
    private String avatarUrl;

    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(user.getId())
                .name(user.getFullName())
                .phone(user.getMobileNumber())
                .email(user.getEmail())
                .role(user.getRole())
                .farmName(user.getFarm() != null ? user.getFarm().getName() : "")
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
