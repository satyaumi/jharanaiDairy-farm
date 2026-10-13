package com.dairyfarm.app.modules.alert.service;

import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.exception.BadRequestException;
import com.dairyfarm.app.common.exception.ResourceNotFoundException;
import com.dairyfarm.app.modules.alert.dto.AlertDto;
import com.dairyfarm.app.modules.alert.dto.CreateAlertRequest;
import com.dairyfarm.app.modules.alert.model.FarmAlert;
import com.dairyfarm.app.modules.alert.model.FarmAlertRead;
import com.dairyfarm.app.modules.alert.repository.FarmAlertReadRepository;
import com.dairyfarm.app.modules.alert.repository.FarmAlertRepository;
import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.animal.repository.AnimalRepository;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import com.dairyfarm.app.modules.user.model.Role;
import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
public class AlertService {

    private final FarmAlertRepository alertRepository;
    private final FarmAlertReadRepository alertReadRepository;
    private final FarmRepository farmRepository;
    private final AnimalRepository animalRepository;
    private final UserRepository userRepository;

    public AlertService(
            FarmAlertRepository alertRepository,
            FarmAlertReadRepository alertReadRepository,
            FarmRepository farmRepository,
            AnimalRepository animalRepository,
            UserRepository userRepository
    ) {
        this.alertRepository = alertRepository;
        this.alertReadRepository = alertReadRepository;
        this.farmRepository = farmRepository;
        this.animalRepository = animalRepository;
        this.userRepository = userRepository;
    }

    private UUID getTenantFarmId() {
        UUID farmId = TenantContext.getFarmId();
        if (farmId == null) {
            return UUID.fromString("a0000000-0000-0000-0000-000000000001");
        }
        return farmId;
    }

    @Transactional
    public AlertDto createAlert(CreateAlertRequest request) {
        UUID farmId = getTenantFarmId();
        UUID currentUserId = TenantContext.getUserId();
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        Animal animal = null;
        String cowNumber = request.getCowNumber() != null ? request.getCowNumber().trim() : null;

        if (request.getAnimalId() != null) {
            animal = animalRepository.findByIdAndFarmId(request.getAnimalId(), farmId).orElse(null);
            if (animal != null && cowNumber == null) {
                cowNumber = animal.getEarTag();
            }
        } else if (cowNumber != null && !cowNumber.isBlank()) {
            animal = animalRepository.findByFarmIdAndEarTagIgnoreCase(farmId, cowNumber).orElse(null);
        }

        String category = request.getCategory() != null && !request.getCategory().isBlank()
                ? request.getCategory().trim().toUpperCase()
                : "GENERAL";

        String severity = request.getSeverity() != null && !request.getSeverity().isBlank()
                ? request.getSeverity().trim().toUpperCase()
                : "NORMAL";

        String targetRole = request.getTargetRole() != null && !request.getTargetRole().isBlank()
                ? request.getTargetRole().trim().toUpperCase()
                : "ALL";

        FarmAlert alert = FarmAlert.builder()
                .farm(farm)
                .title(request.getTitle().trim())
                .message(request.getMessage().trim())
                .category(category)
                .severity(severity)
                .targetRole(targetRole)
                .targetUserId(request.getTargetUserId())
                .animal(animal)
                .cowNumber(cowNumber)
                .eventDate(request.getEventDate())
                .dueDate(request.getDueDate())
                .status("ACTIVE")
                .createdBy(currentUserId)
                .createdByName(currentUser != null ? currentUser.getFullName() : "Management")
                .build();

        FarmAlert saved = alertRepository.save(alert);
        log.info("Created farm alert '{}' with severity {} for target {}", saved.getTitle(), saved.getSeverity(), saved.getTargetRole());

        return AlertDto.fromEntity(saved, false);
    }

    @Transactional(readOnly = true)
    public List<AlertDto> getAlertsForCurrentUser() {
        UUID farmId = getTenantFarmId();
        UUID currentUserId = TenantContext.getUserId();
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;

        String roleStr = "WORKER";
        if (currentUser != null && currentUser.getRole() != null) {
            roleStr = currentUser.getRole().name();
        }

        List<FarmAlert> alerts;
        // Management & Admin can see all farm alerts
        if ("MANAGER".equalsIgnoreCase(roleStr) || "ADMIN".equalsIgnoreCase(roleStr)) {
            alerts = alertRepository.findAllForFarm(farmId);
        } else {
            // Worker and Owner see targeted alerts
            alerts = alertRepository.findActiveAlertsForUserRole(farmId, roleStr, currentUserId);
        }

        Set<UUID> readAlertIds = currentUserId != null
                ? alertReadRepository.findReadAlertIdsByUserId(currentUserId)
                : Collections.emptySet();

        return alerts.stream()
                .map(a -> AlertDto.fromEntity(a, readAlertIds.contains(a.getId())))
                .toList();
    }

    @Transactional
    public void markAsRead(UUID alertId) {
        UUID farmId = getTenantFarmId();
        UUID currentUserId = TenantContext.getUserId();
        if (currentUserId == null) return;

        FarmAlert alert = alertRepository.findByIdAndFarmId(alertId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("FarmAlert", "id", alertId));

        if (!alertReadRepository.existsByAlertIdAndUserId(alert.getId(), currentUserId)) {
            FarmAlertRead read = FarmAlertRead.builder()
                    .alert(alert)
                    .userId(currentUserId)
                    .build();
            alertReadRepository.save(read);
        }
    }

    @Transactional
    public void dismissAlert(UUID alertId) {
        UUID farmId = getTenantFarmId();
        FarmAlert alert = alertRepository.findByIdAndFarmId(alertId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("FarmAlert", "id", alertId));

        alert.setStatus("DISMISSED");
        alertRepository.save(alert);
    }
}
