package com.dairyfarm.app.common.security;

import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrPhoneOrEmail) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameOrEmailOrMobile(usernameOrPhoneOrEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + usernameOrPhoneOrEmail));

        return UserPrincipal.create(
                user.getId(),
                user.getFarm().getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getMobileNumber(),
                user.getPasswordHash(),
                user.getRole(),
                user.isActive()
        );
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(UUID id) {
        User user = userRepository.findByIdWithFarm(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        return UserPrincipal.create(
                user.getId(),
                user.getFarm().getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getMobileNumber(),
                user.getPasswordHash(),
                user.getRole(),
                user.isActive()
        );
    }
}
