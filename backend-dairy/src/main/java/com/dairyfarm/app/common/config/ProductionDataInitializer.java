package com.dairyfarm.app.common.config;

import com.dairyfarm.app.modules.user.model.Role;
import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Production initialization runner for setting secure Farm Owner credentials.
 * If INITIAL_OWNER_PASSWORD is provided in production environment (e.g. Render),
 * it updates the owner's BCrypt password hash automatically without exposing credentials in code.
 */
@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class ProductionDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${INITIAL_OWNER_PASSWORD:#{null}}")
    private String initialOwnerPassword;

    @Value("${INITIAL_OWNER_EMAIL:#{null}}")
    private String initialOwnerEmail;

    @Override
    public void run(ApplicationArguments args) {
        if (initialOwnerPassword != null && !initialOwnerPassword.isBlank()) {
            log.info("Configuring Farm Owner production credentials from environment variable...");
            Optional<User> ownerOpt = userRepository.findByUsername("priya");
            if (ownerOpt.isEmpty()) {
                ownerOpt = userRepository.findAll().stream()
                        .filter(u -> u.getRole() == Role.OWNER)
                        .findFirst();
            }

            ownerOpt.ifPresent(owner -> {
                owner.setPasswordHash(passwordEncoder.encode(initialOwnerPassword.trim()));
                if (initialOwnerEmail != null && !initialOwnerEmail.isBlank()) {
                    owner.setEmail(initialOwnerEmail.trim());
                }
                userRepository.save(owner);
                log.info("Secure production Farm Owner password configured successfully.");
            });
        }
    }
}
