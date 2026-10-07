package com.dairyfarm.app.modules.animal.repository;

import com.dairyfarm.app.modules.animal.model.AnimalGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnimalGroupRepository extends JpaRepository<AnimalGroup, UUID> {
    List<AnimalGroup> findByFarmIdAndActiveTrueOrderByNameAsc(UUID farmId);
    List<AnimalGroup> findByFarmIdOrderByNameAsc(UUID farmId);
    Optional<AnimalGroup> findByIdAndFarmId(UUID id, UUID farmId);
    boolean existsByFarmIdAndName(UUID farmId, String name);
    boolean existsByFarmIdAndNameAndIdNot(UUID farmId, String name, UUID id);
}
