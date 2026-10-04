package com.dairyfarm.app.modules.auth.service;

import com.dairyfarm.app.common.audit.AuditService;
import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.exception.BadRequestException;
import com.dairyfarm.app.common.exception.DuplicateResourceException;
import com.dairyfarm.app.common.exception.ResourceNotFoundException;
import com.dairyfarm.app.common.exception.UnauthorizedException;
import com.dairyfarm.app.common.security.JwtTokenProvider;
import com.dairyfarm.app.common.security.UserPrincipal;
import com.dairyfarm.app.modules.auth.dto.*;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import com.dairyfarm.app.modules.user.model.Role;
import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final FarmRepository farmRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;
    private final OtpService otpService;
    private final ResendEmailService resendEmailService;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        if (request == null || request.getPhoneOrEmail() == null || request.getPhoneOrEmail().isBlank()) {
            throw new BadRequestException("Phone number or email is required");
        }
        String identifier = request.getPhoneOrEmail().trim();

        User user = userRepository.findByUsernameOrEmailOrMobile(identifier)
                .orElse(null);

        // Fallback to normalized phone matching (ignoring spaces, dashes, leading +)
        if (user == null) {
            String digitsOnly = identifier.replaceAll("[^0-9]", "");
            if (digitsOnly.length() >= 7) {
                user = userRepository.findAll().stream()
                        .filter(u -> u.getMobileNumber() != null &&
                                u.getMobileNumber().replaceAll("[^0-9]", "").endsWith(digitsOnly))
                        .findFirst()
                        .orElse(null);
            }
        }

        if (user == null) {
            throw new UnauthorizedException("Invalid mobile/email or password");
        }

        if (!user.isActive()) {
            throw new UnauthorizedException("Your account is currently disabled. Please contact farm administrator.");
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                throw new UnauthorizedException("Invalid mobile/email or password");
            }
        }

        UserPrincipal principal = UserPrincipal.create(
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

        String token = tokenProvider.generateToken(principal);

        TenantContext.setFarmId(user.getFarm().getId());
        TenantContext.setUserId(user.getId());
        auditService.record("LOGIN", "USER", user.getId().toString(), "User logged in: " + user.getMobileNumber());

        return AuthResponse.builder()
                .token(token)
                .user(UserDto.fromEntity(user))
                .build();
    }

    @Transactional
    public Map<String, Object> sendLoginOtp(SendLoginOtpRequest request) {
        if (request == null || request.getPhoneOrEmail() == null || request.getPhoneOrEmail().isBlank()) {
            throw new BadRequestException("Phone number or email is required");
        }
        String identifier = request.getPhoneOrEmail().trim();

        User user = userRepository.findByUsernameOrEmailOrMobile(identifier)
                .orElse(null);

        if (user == null) {
            String digitsOnly = identifier.replaceAll("[^0-9]", "");
            if (digitsOnly.length() >= 7) {
                user = userRepository.findAll().stream()
                        .filter(u -> u.getMobileNumber() != null &&
                                u.getMobileNumber().replaceAll("[^0-9]", "").endsWith(digitsOnly))
                        .findFirst()
                        .orElse(null);
            }
        }

        if (user == null) {
            throw new UnauthorizedException("No registered account found with identifier: " + identifier);
        }

        if (!user.isActive()) {
            throw new UnauthorizedException("Your account is currently disabled. Please contact farm administrator.");
        }

        // Verify role authorization match if specified
        if (request.getRequestedRole() != null) {
            if (user.getRole() != request.getRequestedRole() && user.getRole() != Role.OWNER) {
                throw new UnauthorizedException("Your account does not have " + request.getRequestedRole() + " authorization.");
            }
        }

        String targetEmail = user.getEmail();
        otpService.generateAndSendOtp(identifier, targetEmail, "LOGIN");

        String maskedEmail = (targetEmail != null && targetEmail.contains("@"))
                ? targetEmail.replaceAll("(^[^@]{2})[^@]+(@.*$)", "$1***$2")
                : identifier;

        return Map.of(
                "success", true,
                "message", "Verification code dispatched to " + maskedEmail,
                "email", maskedEmail,
                "role", user.getRole().name()
        );
    }

    @Transactional
    public AuthResponse loginWithOtp(LoginOtpRequest request) {
        if (request == null || request.getPhoneOrEmail() == null || request.getOtp() == null) {
            throw new BadRequestException("Phone number/email and verification code are required");
        }
        String identifier = request.getPhoneOrEmail().trim();

        User user = userRepository.findByUsernameOrEmailOrMobile(identifier)
                .orElse(null);

        if (user == null) {
            String digitsOnly = identifier.replaceAll("[^0-9]", "");
            if (digitsOnly.length() >= 7) {
                user = userRepository.findAll().stream()
                        .filter(u -> u.getMobileNumber() != null &&
                                u.getMobileNumber().replaceAll("[^0-9]", "").endsWith(digitsOnly))
                        .findFirst()
                        .orElse(null);
            }
        }

        if (user == null) {
            throw new UnauthorizedException("Invalid mobile/email or verification code");
        }

        if (!user.isActive()) {
            throw new UnauthorizedException("Your account is currently disabled. Please contact farm administrator.");
        }

        if (request.getRequestedRole() != null) {
            if (user.getRole() != request.getRequestedRole() && user.getRole() != Role.OWNER) {
                throw new UnauthorizedException("Your account does not have " + request.getRequestedRole() + " authorization.");
            }
        }

        boolean verified = false;
        try {
            verified = otpService.verifyOtp(identifier, request.getOtp(), "LOGIN");
        } catch (BadRequestException ex) {
            if (user.getMobileNumber() != null) {
                try {
                    verified = otpService.verifyOtp(user.getMobileNumber(), request.getOtp(), "LOGIN");
                } catch (BadRequestException ignored) {}
            }
            if (!verified && user.getEmail() != null) {
                try {
                    verified = otpService.verifyOtp(user.getEmail(), request.getOtp(), "LOGIN");
                } catch (BadRequestException ignored) {}
            }
            if (!verified) {
                throw ex;
            }
        }

        UserPrincipal principal = UserPrincipal.create(
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

        String token = tokenProvider.generateToken(principal);

        TenantContext.setFarmId(user.getFarm().getId());
        TenantContext.setUserId(user.getId());
        auditService.record("LOGIN_OTP", "USER", user.getId().toString(), "User logged in via verified OTP: " + user.getMobileNumber());

        return AuthResponse.builder()
                .token(token)
                .user(UserDto.fromEntity(user))
                .build();
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String mobile = request.getPhone().trim();

        if (userRepository.findByMobileNumber(mobile).isPresent()) {
            throw new DuplicateResourceException("User with mobile number '" + mobile + "' is already registered");
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (userRepository.existsByEmail(request.getEmail().trim())) {
                throw new DuplicateResourceException("User with email '" + request.getEmail().trim() + "' is already registered");
            }
        }

        // 1. Create Farm for new Owner
        String farmCode = "FARM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Farm farm = Farm.builder()
                .name(request.getFarmName().trim())
                .code(farmCode)
                .contactNumber(mobile)
                .active(true)
                .build();
        Farm savedFarm = farmRepository.saveAndFlush(farm);

        // 2. Create User
        Role role = request.getRole() != null ? request.getRole() : Role.OWNER;
        User user = User.builder()
                .farm(savedFarm)
                .fullName(request.getName().trim())
                .mobileNumber(mobile)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .active(true)
                .verified(true)
                .build();

        User savedUser = userRepository.saveAndFlush(user);

        UserPrincipal principal = UserPrincipal.create(
                savedUser.getId(),
                savedFarm.getId(),
                savedUser.getFullName(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getMobileNumber(),
                savedUser.getPasswordHash(),
                savedUser.getRole(),
                savedUser.isActive()
        );

        String token = tokenProvider.generateToken(principal);

        TenantContext.setFarmId(savedFarm.getId());
        TenantContext.setUserId(savedUser.getId());
        auditService.record("SIGNUP", "USER", savedUser.getId().toString(), "New farm and user registered: " + savedUser.getMobileNumber());

        return AuthResponse.builder()
                .token(token)
                .user(UserDto.fromEntity(savedUser))
                .build();
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String phone = request.getPhone().trim();
        User user = userRepository.findByMobileNumber(phone)
                .orElse(null);

        if (user == null) {
            user = userRepository.findByUsernameOrEmailOrMobile(phone)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "identifier", phone));
        }

        otpService.verifyOtp(phone, request.getOtp(), "REGISTRATION_VERIFY");

        user.setVerified(true);
        userRepository.save(user);

        UserPrincipal principal = UserPrincipal.create(
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

        String token = tokenProvider.generateToken(principal);
        return AuthResponse.builder()
                .token(token)
                .user(UserDto.fromEntity(user))
                .build();
    }

    @Transactional
    public boolean resendOtp(ResendOtpRequest request) {
        if (request == null || request.getPhone() == null || request.getPhone().isBlank()) {
            throw new BadRequestException("Phone or email is required");
        }
        String identifier = request.getPhone().trim();
        User user = userRepository.findByUsernameOrEmailOrMobile(identifier).orElse(null);
        String targetEmail = user != null ? user.getEmail() : (identifier.contains("@") ? identifier : null);

        otpService.generateAndSendOtp(identifier, targetEmail, "PASSWORD_RESET");
        return true;
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        if (request == null || request.getPhoneOrEmail() == null || request.getPhoneOrEmail().isBlank()) {
            throw new BadRequestException("Phone or email is required");
        }
        String identifier = request.getPhoneOrEmail().trim();
        User user = userRepository.findByUsernameOrEmailOrMobile(identifier).orElse(null);
        String targetEmail = user != null ? user.getEmail() : (identifier.contains("@") ? identifier : null);

        // Always generate to prevent enumeration
        otpService.generateAndSendOtp(identifier, targetEmail, "PASSWORD_RESET");
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser() {
        UUID userId = TenantContext.getUserId();
        if (userId == null) {
            throw new UnauthorizedException("No authenticated user session");
        }

        User user = userRepository.findByIdWithFarm(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return UserDto.fromEntity(user);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (request == null || request.getPhoneOrEmail() == null || request.getOtp() == null || request.getNewPassword() == null) {
            throw new BadRequestException("All fields are required to reset password");
        }
        String identifier = request.getPhoneOrEmail().trim();
        User user = userRepository.findByUsernameOrEmailOrMobile(identifier)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + identifier));

        otpService.verifyOtp(identifier, request.getOtp(), "PASSWORD_RESET");

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditService.record("RESET_PASSWORD", "USER", user.getId().toString(), "Password reset successfully via verified OTP");
    }

    @Transactional
    public UserDto updateProfile(UpdateProfileRequest request) {
        UUID userId = TenantContext.getUserId();
        if (userId == null) {
            throw new UnauthorizedException("No authenticated user session");
        }

        User user = userRepository.findByIdWithFarm(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setFullName(request.getName().trim());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String email = request.getEmail().trim();
            if (!email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
                throw new DuplicateResourceException("Email " + email + " is already in use");
            }
            user.setEmail(email);
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        User saved = userRepository.save(user);
        auditService.record("UPDATE_PROFILE", "USER", saved.getId().toString(), "Updated profile details");
        return UserDto.fromEntity(saved);
    }

    public void logout() {
        UUID userId = TenantContext.getUserId();
        if (userId != null) {
            auditService.record("LOGOUT", "USER", userId.toString(), "User logged out");
        }
    }
}
