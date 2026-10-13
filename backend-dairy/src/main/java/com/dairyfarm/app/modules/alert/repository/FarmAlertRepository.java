package com.dairyfarm.app.modules.alert.repository;

import com.dairyfarm.app.modules.alert.model.FarmAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FarmAlertRepository extends JpaRepository<FarmAlert, UUID> {

    Optional<FarmAlert> findByIdAndFarmId(UUID id, UUID farmId);

    List<FarmAlert> findByFarmIdAndStatusOrderByCreatedAtDesc(UUID farmId, String status);

    @Query("SELECT a FROM FarmAlert a WHERE a.farm.id = :farmId AND a.status = 'ACTIVE' " +
           "AND (a.targetRole = 'ALL' OR a.targetRole = :role OR a.targetUserId = :userId) " +
           "ORDER BY CASE a.severity WHEN 'CRITICAL' THEN 1 WHEN 'IMPORTANT' THEN 2 ELSE 3 END, a.createdAt DESC")
    List<FarmAlert> findActiveAlertsForUserRole(
            @Param("farmId") UUID farmId,
            @Param("role") String role,
            @Param("userId") UUID userId
    );

    @Query("SELECT a FROM FarmAlert a WHERE a.farm.id = :farmId " +
           "ORDER BY CASE a.severity WHEN 'CRITICAL' THEN 1 WHEN 'IMPORTANT' THEN 2 ELSE 3 END, a.createdAt DESC")
    List<FarmAlert> findAllForFarm(@Param("farmId") UUID farmId);
}
