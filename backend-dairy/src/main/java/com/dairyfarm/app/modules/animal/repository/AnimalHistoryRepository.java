package com.dairyfarm.app.modules.animal.repository;

import com.dairyfarm.app.modules.animal.model.AnimalHistory;
import com.dairyfarm.app.modules.animal.model.HistoryEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AnimalHistoryRepository extends JpaRepository<AnimalHistory, UUID> {

    List<AnimalHistory> findByAnimalIdAndFarmIdOrderByEventDateDescCreatedAtDesc(UUID animalId, UUID farmId);

    List<AnimalHistory> findByAnimalIdAndFarmIdOrderByEventDateAscCreatedAtAsc(UUID animalId, UUID farmId);

    boolean existsByAnimalIdAndFarmIdAndEventTypeAndEventDate(UUID animalId, UUID farmId, HistoryEventType eventType, LocalDate eventDate);

    boolean existsByAnimalIdAndFarmIdAndEventType(UUID animalId, UUID farmId, HistoryEventType eventType);
}
