package com.dairyfarm.app.modules.auth.controller;

import com.dairyfarm.app.modules.auth.dto.*;
import com.dairyfarm.app.modules.auth.service.AuthService;
import com.dairyfarm.app.modules.user.dto.ActivateAccountRequest;
import com.dairyfarm.app.modules.user.dto.InvitationInfoDto;
import com.dairyfarm.app.modules.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for farm user authentication and session management")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user using mobile/email and password")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup")
    @Operation(summary = "Register a new farm and owner account")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP for phone authentication")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend one-time password to mobile")
    public ResponseEntity<Map<String, Object>> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        boolean sent = authService.resendOtp(request);
        return ResponseEntity.ok(Map.of("success", sent, "message", "OTP resent successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get currently authenticated user profile")
    public ResponseEntity<UserDto> getCurrentUser() {
        UserDto user = authService.getCurrentUser();
        return ResponseEntity.ok(user);
    }

    @PutMapping("/profile")
    @Operation(summary = "Update authenticated user profile information")
    public ResponseEntity<UserDto> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UserDto user = authService.updateProfile(request);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset OTP via email or SMS")
    public ResponseEntity<Map<String, Object>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("success", true, "message", "If an account exists with this mobile/email, a verification code has been dispatched."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using OTP verification")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("success", true, "message", "Password reset successfully"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Log out user from current session")
    public ResponseEntity<Map<String, Object>> logout() {
        authService.logout();
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out successfully"));
    }

    @GetMapping("/invitation-info")
    @Operation(summary = "Get invitation details to display on account activation page")
    public ResponseEntity<InvitationInfoDto> getInvitationInfo(@RequestParam String token) {
        InvitationInfoDto info = userService.getInvitationInfo(token);
        return ResponseEntity.ok(info);
    }

    @PostMapping("/activate-account")
    @Operation(summary = "Activate invited worker or management account and set password")
    public ResponseEntity<Map<String, Object>> activateAccount(@Valid @RequestBody ActivateAccountRequest request) {
        userService.activateAccount(request);
        return ResponseEntity.ok(Map.of("success", true, "message", "Account activated successfully. You can now log in."));
    }
}
