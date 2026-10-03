package com.dairyfarm.app.modules.farm.service;

import com.dairyfarm.app.common.audit.AuditService;
import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.exception.BadRequestException;
import com.dairyfarm.app.common.exception.DuplicateResourceException;
import com.dairyfarm.app.common.exception.ResourceNotFoundException;
import com.dairyfarm.app.modules.farm.dto.CreateFarmRequest;
import com.dairyfarm.app.modules.farm.dto.FarmDto;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmService {

    private final FarmRepository farmRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public FarmDto getCurrentFarm() {
        UUID farmId = TenantContext.getFarmId();
        if (farmId == null) {
            throw new BadRequestException("No tenant farm context found for the current request");
        }
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));
        return FarmDto.fromEntity(farm);
    }

    @Transactional(readOnly = true)
    public FarmDto getFarmById(UUID farmId) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));
        return FarmDto.fromEntity(farm);
    }

    @Transactional
    public FarmDto createFarm(CreateFarmRequest request) {
        if (request.getCode() != null && farmRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Farm with code '" + request.getCode() + "' already exists");
        }

        Farm farm = Farm.builder()
                .name(request.getName())
                .code(request.getCode())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry() != null ? request.getCountry() : "India")
                .contactNumber(request.getContactNumber())
                .email(request.getEmail())
                .active(true)
                .build();

        Farm saved = farmRepository.save(farm);
        auditService.record("CREATE_FARM", "FARM", saved.getId().toString(), "Created farm: " + saved.getName());
        return FarmDto.fromEntity(saved);
    }
}
