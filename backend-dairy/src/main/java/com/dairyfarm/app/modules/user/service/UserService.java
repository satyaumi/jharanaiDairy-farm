package com.dairyfarm.app.modules.user.service;

import com.dairyfarm.app.common.audit.AuditService;
import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.exception.BadRequestException;
import com.dairyfarm.app.common.exception.DuplicateResourceException;
import com.dairyfarm.app.common.exception.ResourceNotFoundException;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import com.dairyfarm.app.modules.user.dto.*;
import com.dairyfarm.app.modules.user.model.Role;
import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.model.UserStatus;
import com.dairyfarm.app.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FarmRepository farmRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final com.dairyfarm.app.modules.auth.service.ResendEmailService resendEmailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional(readOnly = true)
    public List<UserResponseDto> getFarmUsers(String search, Role role, UserStatus status, String department) {
        UUID farmId = getTenantFarmId();
        User currentUser = getCurrentUser();

        if (currentUser.getRole() == Role.WORKER) {
            throw new AccessDeniedException("Workers are not authorized to view team management");
        }

        List<User> users;
        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.searchFarmUsers(farmId, search.trim());
        } else {
            users = userRepository.findByFarmIdOrderByCreatedAtDesc(farmId);
        }

        return users.stream()
                .filter(u -> role == null || u.getRole() == role)
                .filter(u -> status == null || u.getStatus() == status)
                .filter(u -> department == null || (u.getDepartment() != null && u.getDepartment().equalsIgnoreCase(department)))
                .map(UserResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TeamSummaryDto getTeamSummary() {
        UUID farmId = getTenantFarmId();
        long total = userRepository.countByFarmId(farmId);
        long mgmt = userRepository.countByFarmIdAndRole(farmId, Role.MANAGER);
        long wrk = userRepository.countByFarmIdAndRole(farmId, Role.WORKER);
        long active = userRepository.countByFarmIdAndActiveTrue(farmId);
        long pending = userRepository.countByFarmIdAndStatus(farmId, UserStatus.PENDING_ACTIVATION)
                + userRepository.countByFarmIdAndStatus(farmId, UserStatus.INVITED);

        return TeamSummaryDto.builder()
                .totalMembers(total)
                .managementCount(mgmt)
                .workerCount(wrk)
                .activeCount(active)
                .pendingCount(pending)
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponseDto getUserById(UUID id) {
        UUID farmId = getTenantFarmId();
        User user = userRepository.findById(id)
                .filter(u -> u.getFarm().getId().equals(farmId))
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        User currentUser = getCurrentUser();
        if (currentUser.getRole() == Role.WORKER && !currentUser.getId().equals(id)) {
            throw new AccessDeniedException("Workers can only view their own profile");
        }

        return UserResponseDto.fromEntity(user);
    }

    @Transactional
    public UserResponseDto createWorker(CreateWorkerRequest request) {
        UUID farmId = getTenantFarmId();
        User currentUser = getCurrentUser();

        if (currentUser.getRole() == Role.WORKER) {
            throw new AccessDeniedException("Workers cannot create new worker accounts");
        }

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        String cleanMobile = request.getMobileNumber().trim();
        if (userRepository.existsByFarmIdAndMobileNumber(farmId, cleanMobile)) {
            throw new DuplicateResourceException("A worker with phone " + cleanMobile + " already exists in this farm");
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            if (userRepository.existsByEmail(request.getEmail().trim())) {
                throw new DuplicateResourceException("A user with email " + request.getEmail().trim() + " already exists");
            }
        }

        String employeeId = generateUniqueEmployeeId("JHF-WRK");
        String username = generateUniqueUsername("jharanai.wrk");
        String token = generateSecureToken();

        User worker = User.builder()
                .farm(farm)
                .fullName(request.getFullName().trim())
                .username(username)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .mobileNumber(cleanMobile)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString())) // Temporary secure hash
                .role(Role.WORKER)
                .employeeId(employeeId)
                .department(request.getDepartment() != null ? request.getDepartment().trim() : "Operations")
                .jobPosition(request.getJobPosition() != null ? request.getJobPosition().trim() : "Farm Worker")
                .assignedArea(request.getAssignedArea() != null ? request.getAssignedArea().trim() : "Barn Area")
                .shift(request.getShift() != null ? request.getShift().trim() : "Morning")
                .employmentStatus(request.getEmploymentStatus() != null ? request.getEmploymentStatus().trim() : "Full-time")
                .status(request.isSendInvitation() ? UserStatus.PENDING_ACTIVATION : UserStatus.ACTIVE)
                .active(true)
                .verified(false)
                .joiningDate(request.getJoiningDate() != null ? request.getJoiningDate() : LocalDate.now())
                .emergencyContact(request.getEmergencyContact() != null ? request.getEmergencyContact().trim() : null)
                .invitationToken(request.isSendInvitation() ? token : null)
                .invitationTokenExpiry(request.isSendInvitation() ? Instant.now().plus(72, ChronoUnit.HOURS) : null)
                .invitationSentAt(request.isSendInvitation() ? Instant.now() : null)
                .build();

        User saved = userRepository.save(worker);
        auditService.record("CREATE_WORKER", "USER", saved.getId().toString(),
                "Created worker " + saved.getFullName() + " (" + saved.getUsername() + ", ID: " + employeeId + ")");

        if (request.isSendInvitation() && saved.getEmail() != null && !saved.getEmail().isBlank()) {
            resendEmailService.sendInvitationEmail(
                    saved.getEmail(),
                    saved.getFullName(),
                    saved.getFarm().getName(),
                    "Dairy Worker",
                    token,
                    null
            );
        }

        return UserResponseDto.fromEntity(saved);
    }

    @Transactional
    public UserResponseDto createManagement(CreateManagementRequest request) {
        UUID farmId = getTenantFarmId();
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.OWNER && currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only Farm Owners can add Management Team members");
        }

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new DuplicateResourceException("A user with email " + cleanEmail + " already exists");
        }

        String cleanMobile = request.getMobileNumber().trim();
        if (userRepository.existsByFarmIdAndMobileNumber(farmId, cleanMobile)) {
            throw new DuplicateResourceException("A team member with phone " + cleanMobile + " already exists in this farm");
        }

        String employeeId = generateUniqueEmployeeId("JHF-MGT");
        String username = generateUniqueUsername("jharanai.mgmt");
        String token = generateSecureToken();

        User manager = User.builder()
                .farm(farm)
                .fullName(request.getFullName().trim())
                .username(username)
                .email(cleanEmail)
                .mobileNumber(cleanMobile)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(Role.MANAGER)
                .employeeId(employeeId)
                .department(request.getDepartment() != null ? request.getDepartment().trim() : "Farm Operations")
                .jobPosition(request.getJobPosition() != null ? request.getJobPosition().trim() : "Operations Manager")
                .responsibilities(request.getResponsibilities() != null ? request.getResponsibilities().trim() : null)
                .employmentStatus(request.getEmploymentStatus() != null ? request.getEmploymentStatus().trim() : "Full-time")
                .status(request.isSendInvitation() ? UserStatus.PENDING_ACTIVATION : UserStatus.ACTIVE)
                .active(true)
                .verified(false)
                .joiningDate(request.getJoiningDate() != null ? request.getJoiningDate() : LocalDate.now())
                .invitationToken(request.isSendInvitation() ? token : null)
                .invitationTokenExpiry(request.isSendInvitation() ? Instant.now().plus(72, ChronoUnit.HOURS) : null)
                .invitationSentAt(request.isSendInvitation() ? Instant.now() : null)
                .build();

        User saved = userRepository.save(manager);
        auditService.record("CREATE_MANAGEMENT", "USER", saved.getId().toString(),
                "Created management member " + saved.getFullName() + " (" + saved.getUsername() + ", ID: " + employeeId + ")");

        if (request.isSendInvitation() && saved.getEmail() != null && !saved.getEmail().isBlank()) {
            resendEmailService.sendInvitationEmail(
                    saved.getEmail(),
                    saved.getFullName(),
                    saved.getFarm().getName(),
                    "Operations Manager",
                    token,
                    null
            );
        }

        return UserResponseDto.fromEntity(saved);
    }

    @Transactional
    public UserResponseDto updateUser(UUID id, UpdateUserRequest request) {
        UUID farmId = getTenantFarmId();
        User currentUser = getCurrentUser();

        User target = userRepository.findById(id)
                .filter(u -> u.getFarm().getId().equals(farmId))
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        // Authorization checks
        if (currentUser.getRole() == Role.WORKER && !currentUser.getId().equals(id)) {
            throw new AccessDeniedException("Workers cannot edit other users");
        }
        if (currentUser.getRole() == Role.MANAGER && target.getRole() != Role.WORKER && !currentUser.getId().equals(id)) {
            throw new AccessDeniedException("Management staff can only edit worker profiles");
        }

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            target.setFullName(request.getFullName().trim());
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(target.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new DuplicateResourceException("Email " + newEmail + " is already in use");
            }
            target.setEmail(newEmail);
        }
        if (request.getMobileNumber() != null && !request.getMobileNumber().trim().isEmpty()) {
            String newPhone = request.getMobileNumber().trim();
            if (!newPhone.equals(target.getMobileNumber()) && userRepository.existsByFarmIdAndMobileNumber(farmId, newPhone)) {
                throw new DuplicateResourceException("Phone number " + newPhone + " is already registered in this farm");
            }
            target.setMobileNumber(newPhone);
        }
        if (request.getDepartment() != null) target.setDepartment(request.getDepartment().trim());
        if (request.getJobPosition() != null) target.setJobPosition(request.getJobPosition().trim());
        if (request.getAssignedArea() != null) target.setAssignedArea(request.getAssignedArea().trim());
        if (request.getShift() != null) target.setShift(request.getShift().trim());
        if (request.getEmploymentStatus() != null) target.setEmploymentStatus(request.getEmploymentStatus().trim());
        if (request.getJoiningDate() != null) target.setJoiningDate(request.getJoiningDate());
        if (request.getEmergencyContact() != null) target.setEmergencyContact(request.getEmergencyContact().trim());
        if (request.getResponsibilities() != null) target.setResponsibilities(request.getResponsibilities().trim());

        User saved = userRepository.save(target);
        auditService.record("UPDATE_USER", "USER", saved.getId().toString(),
                "Updated details for " + saved.getFullName() + " (" + saved.getUsername() + ")");

        return UserResponseDto.fromEntity(saved);
    }

    @Transactional
    public UserResponseDto updateStatus(UUID id, UserStatus newStatus) {
        UUID farmId = getTenantFarmId();
        User currentUser = getCurrentUser();

        User target = userRepository.findById(id)
                .filter(u -> u.getFarm().getId().equals(farmId))
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (target.getRole() == Role.OWNER) {
            throw new BadRequestException("Cannot change status of Farm Owner account");
        }

        if (currentUser.getRole() == Role.MANAGER && target.getRole() != Role.WORKER) {
            throw new AccessDeniedException("Management staff can only manage worker status");
        }
        if (currentUser.getRole() == Role.WORKER) {
            throw new AccessDeniedException("Workers cannot alter user status");
        }

        target.setStatus(newStatus);
        target.setActive(newStatus == UserStatus.ACTIVE);

        User saved = userRepository.save(target);
        auditService.record("USER_STATUS_CHANGE", "USER", saved.getId().toString(),
                "Changed status of " + saved.getUsername() + " to " + newStatus);

        return UserResponseDto.fromEntity(saved);
    }

    @Transactional
    public UserResponseDto resendInvitation(UUID id) {
        UUID farmId = getTenantFarmId();
        User currentUser = getCurrentUser();

        User target = userRepository.findById(id)
                .filter(u -> u.getFarm().getId().equals(farmId))
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (currentUser.getRole() == Role.MANAGER && target.getRole() != Role.WORKER) {
            throw new AccessDeniedException("Management staff can only manage worker invitations");
        }
        if (currentUser.getRole() == Role.WORKER) {
            throw new AccessDeniedException("Workers cannot send invitations");
        }

        String newToken = generateSecureToken();
        target.setInvitationToken(newToken);
        target.setInvitationTokenExpiry(Instant.now().plus(72, ChronoUnit.HOURS));
        target.setInvitationSentAt(Instant.now());
        target.setStatus(UserStatus.PENDING_ACTIVATION);

        User saved = userRepository.save(target);
        auditService.record("RESEND_INVITATION", "USER", saved.getId().toString(),
                "Resent invitation to " + saved.getUsername() + " (" + saved.getEmail() + ")");

        if (saved.getEmail() != null && !saved.getEmail().isBlank()) {
            String roleName = saved.getRole() == Role.MANAGER ? "Operations Manager" : "Dairy Worker";
            resendEmailService.sendInvitationEmail(
                    saved.getEmail(),
                    saved.getFullName(),
                    saved.getFarm().getName(),
                    roleName,
                    newToken,
                    null
            );
        }

        return UserResponseDto.fromEntity(saved);
    }

    @Transactional
    public void activateAccount(ActivateAccountRequest request) {
        User user = userRepository.findByInvitationToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired invitation link."));

        if (user.getInvitationTokenExpiry() != null && user.getInvitationTokenExpiry().isBefore(Instant.now())) {
            throw new BadRequestException("This invitation link has expired. Please contact your farm owner for a new link.");
        }

        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.ACTIVE);
        user.setActive(true);
        user.setVerified(true);
        user.setInvitationToken(null);
        user.setInvitationTokenExpiry(null);

        userRepository.save(user);
        auditService.record("ACCOUNT_ACTIVATED", "USER", user.getId().toString(),
                "User " + user.getUsername() + " activated their account successfully");
    }

    @Transactional(readOnly = true)
    public InvitationInfoDto getInvitationInfo(String token) {
        return userRepository.findByInvitationToken(token)
                .map(u -> {
                    boolean expired = u.getInvitationTokenExpiry() != null && u.getInvitationTokenExpiry().isBefore(Instant.now());
                    if (expired) {
                        return InvitationInfoDto.builder()
                                .valid(false)
                                .message("This invitation link has expired. Please request a new one.")
                                .build();
                    }
                    return InvitationInfoDto.builder()
                            .valid(true)
                            .name(u.getFullName())
                            .username(u.getUsername())
                            .role(u.getRole())
                            .farmName(u.getFarm() != null ? u.getFarm().getName() : "Jharanai Farm")
                            .message("Invitation valid for " + u.getFullName())
                            .build();
                })
                .orElse(InvitationInfoDto.builder()
                        .valid(false)
                        .message("Invalid invitation link. Please verify your activation link.")
                        .build());
    }

    private String generateUniqueEmployeeId(String prefix) {
        int index = 1;
        while (true) {
            String candidate = String.format("%s-%03d", prefix, index);
            if (!userRepository.existsByEmployeeId(candidate)) {
                return candidate;
            }
            index++;
        }
    }

    private String generateUniqueUsername(String prefix) {
        int index = 1;
        while (true) {
            String candidate = String.format("%s.%03d", prefix, index);
            if (!userRepository.existsByUsername(candidate)) {
                return candidate;
            }
            index++;
        }
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return java.util.HexFormat.of().formatHex(bytes);
    }

    private UUID getTenantFarmId() {
        UUID farmId = TenantContext.getFarmId();
        if (farmId == null) {
            User currentUser = getCurrentUser();
            if (currentUser != null && currentUser.getFarm() != null) {
                return currentUser.getFarm().getId();
            }
            throw new BadRequestException("No tenant farm context found for the current request");
        }
        return farmId;
    }

    private User getCurrentUser() {
        UUID userId = TenantContext.getUserId();
        if (userId == null) {
            throw new BadRequestException("Unauthenticated request context");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }
}
