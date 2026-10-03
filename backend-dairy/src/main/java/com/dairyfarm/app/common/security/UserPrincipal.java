package com.dairyfarm.app.common.security;

import com.dairyfarm.app.modules.user.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final UUID farmId;
    private final String fullName;
    private final String username;
    private final String email;
    private final String mobileNumber;
    private final String password;
    private final Role role;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(UUID id, UUID farmId, String fullName, String username,
                                       String email, String mobileNumber, String passwordHash,
                                       Role role, boolean active) {
        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role.name());
        return UserPrincipal.builder()
                .id(id)
                .farmId(farmId)
                .fullName(fullName)
                .username(username != null ? username : mobileNumber)
                .email(email)
                .mobileNumber(mobileNumber)
                .password(passwordHash)
                .role(role)
                .active(active)
                .authorities(Collections.singletonList(authority))
                .build();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
