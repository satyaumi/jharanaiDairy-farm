package com.dairyfarm.app.modules.medicine.repository;

import com.dairyfarm.app.modules.medicine.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, UUID> {
    List<Medicine> findByFarmIdAndActiveTrueOrderByNameAsc(UUID farmId);
    List<Medicine> findByFarmIdOrderByNameAsc(UUID farmId);
    Optional<Medicine> findByIdAndFarmId(UUID id, UUID farmId);
    boolean existsByFarmIdAndName(UUID farmId, String name);
    boolean existsByFarmIdAndNameAndIdNot(UUID farmId, String name, UUID id);
}
