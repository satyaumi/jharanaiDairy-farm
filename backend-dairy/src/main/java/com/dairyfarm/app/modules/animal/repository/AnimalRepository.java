package com.dairyfarm.app.modules.animal.repository;

import com.dairyfarm.app.modules.animal.model.Animal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnimalRepository extends JpaRepository<Animal, UUID>, JpaSpecificationExecutor<Animal> {

    Optional<Animal> findByIdAndFarmId(UUID id, UUID farmId);

    Optional<Animal> findByFarmIdAndEarTag(UUID farmId, String earTag);

    boolean existsByFarmIdAndEarTag(UUID farmId, String earTag);

    boolean existsByFarmIdAndEarTagAndIdNot(UUID farmId, String earTag, UUID id);

    Page<Animal> findByFarmIdAndActiveTrue(UUID farmId, Pageable pageable);

    List<Animal> findByFarmIdAndActiveTrue(UUID farmId);

    List<Animal> findByFarmId(UUID farmId);

    List<Animal> findByActiveTrue();
}
