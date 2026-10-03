package com.dairyfarm.app.common.audit;

import com.dairyfarm.app.common.context.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String action, String entityType, String entityId, String details) {
        try {
            UUID farmId = TenantContext.getFarmId();
            UUID userId = TenantContext.getUserId();

            // During initial SIGNUP, user and farm are not yet committed in DB
            if ("SIGNUP".equalsIgnoreCase(action)) {
                userId = null;
                farmId = null;
            }

            AuditLog logEntry = AuditLog.builder()
                    .farmId(farmId)
                    .userId(userId)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .details(details)
                    .build();

            auditLogRepository.save(logEntry);
            log.info("Audit logged: action={}, entityType={}, entityId={}", action, entityType, entityId);
        } catch (Exception ex) {
            log.error("Failed to record audit log: {}", ex.getMessage());
        }
    }
}
