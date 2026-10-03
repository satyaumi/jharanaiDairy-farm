package com.dairyfarm.app.modules.farm.repository;

import com.dairyfarm.app.modules.farm.model.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FarmRepository extends JpaRepository<Farm, UUID> {
    Optional<Farm> findByCode(String code);
    boolean existsByCode(String code);
}
