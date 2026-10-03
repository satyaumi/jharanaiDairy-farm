package com.dairyfarm.app.modules.animal.repository;

import com.dairyfarm.app.modules.animal.model.AnimalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnimalHistoryRepository extends JpaRepository<AnimalHistory, UUID> {

    List<AnimalHistory> findByAnimalIdAndFarmIdOrderByEventDateDescCreatedAtDesc(UUID animalId, UUID farmId);

    List<AnimalHistory> findByAnimalIdAndFarmIdOrderByEventDateAscCreatedAtAsc(UUID animalId, UUID farmId);
}
