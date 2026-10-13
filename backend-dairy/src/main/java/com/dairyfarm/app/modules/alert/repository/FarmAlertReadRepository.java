package com.dairyfarm.app.modules.alert.repository;

import com.dairyfarm.app.modules.alert.model.FarmAlertRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface FarmAlertReadRepository extends JpaRepository<FarmAlertRead, UUID> {

    Optional<FarmAlertRead> findByAlertIdAndUserId(UUID alertId, UUID userId);

    boolean existsByAlertIdAndUserId(UUID alertId, UUID userId);

    List<FarmAlertRead> findByUserId(UUID userId);

    @org.springframework.data.jpa.repository.Query("SELECT r.alert.id FROM FarmAlertRead r WHERE r.userId = :userId")
    Set<UUID> findReadAlertIdsByUserId(@org.springframework.data.repository.query.Param("userId") UUID userId);
}
