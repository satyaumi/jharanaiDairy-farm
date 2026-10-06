package com.dairyfarm.app.modules.animal.service;

import com.dairyfarm.app.common.api.PagedResponse;
import com.dairyfarm.app.common.audit.AuditService;
import com.dairyfarm.app.common.context.TenantContext;
import com.dairyfarm.app.common.exception.BadRequestException;
import com.dairyfarm.app.common.exception.DuplicateResourceException;
import com.dairyfarm.app.common.exception.ResourceNotFoundException;
import com.dairyfarm.app.modules.animal.dto.*;
import com.dairyfarm.app.modules.animal.model.*;
import com.dairyfarm.app.modules.animal.repository.AnimalHistoryRepository;
import com.dairyfarm.app.modules.animal.repository.AnimalRepository;
import com.dairyfarm.app.modules.farm.model.Farm;
import com.dairyfarm.app.modules.farm.repository.FarmRepository;
import com.dairyfarm.app.modules.feed.repository.FeedRecordRepository;
import com.dairyfarm.app.modules.milk.repository.MilkRecordRepository;
import com.dairyfarm.app.modules.user.model.User;
import com.dairyfarm.app.modules.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final AnimalHistoryRepository historyRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final MilkRecordRepository milkRecordRepository;
    private final FeedRecordRepository feedRecordRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PagedResponse<AnimalDto> getAnimals(
            String search,
            String status,
            AnimalType animalType,
            String breed,
            LifecycleStatus lifecycleStatus,
            Boolean active,
            Pageable pageable) {

        UUID farmId = getTenantFarmId();

        boolean hasSearch = search != null && !search.isBlank();
        boolean hasStatus = status != null && !status.isBlank();
        boolean hasType = animalType != null;
        boolean hasBreed = breed != null && !breed.isBlank();
        boolean hasLifecycleStatus = lifecycleStatus != null;
        boolean hasActive = active != null;

        Specification<Animal> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("farm").get("id"), farmId));

            if (hasActive) {
                predicates.add(cb.equal(root.get("active"), active));
            } else if (!hasLifecycleStatus) {
                // By default, if no lifecycle status filter is given and active is not specified, show active herd
                predicates.add(cb.isTrue(root.get("active")));
            }

            if (hasLifecycleStatus) {
                predicates.add(cb.equal(root.get("lifecycleStatus"), lifecycleStatus));
            }

            if (hasSearch) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("animalName")), pattern),
                        cb.like(cb.lower(root.get("earTag")), pattern)
                ));
            }
            if (hasStatus) {
                predicates.add(cb.equal(root.get("status"), status.trim()));
            }
            if (hasType) {
                predicates.add(cb.equal(root.get("animalType"), animalType));
            }
            if (hasBreed) {
                String breedPattern = "%" + breed.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("breed")), breedPattern));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Animal> page = animalRepository.findAll(spec, pageable);

        List<AnimalDto> dtos = page.getContent().stream()
                .map(AnimalDto::fromEntity)
                .toList();

        return PagedResponse.<AnimalDto>builder()
                .content(dtos)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AnimalDto> getAllActiveAnimals() {
        UUID farmId = getTenantFarmId();
        return animalRepository.findByFarmIdAndActiveTrue(farmId).stream()
                .map(AnimalDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnimalDto> getAllAnimals(Boolean active, LifecycleStatus lifecycleStatus) {
        UUID farmId = getTenantFarmId();
        if (Boolean.TRUE.equals(active)) {
            return animalRepository.findByFarmIdAndActiveTrue(farmId).stream()
                    .map(AnimalDto::fromEntity)
                    .toList();
        } else {
            return animalRepository.findByFarmId(farmId).stream()
                    .filter(a -> lifecycleStatus == null || a.getLifecycleStatus() == lifecycleStatus)
                    .filter(a -> active == null || a.isActive() == active)
                    .map(AnimalDto::fromEntity)
                    .toList();
        }
    }

    @Transactional(readOnly = true)
    public AnimalDto getAnimalById(UUID animalId) {
        UUID farmId = getTenantFarmId();
        Animal animal = animalRepository.findByIdAndFarmId(animalId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Animal", "id", animalId));
        return AnimalDto.fromEntity(animal);
    }

    @Transactional
    public AnimalDto createAnimal(CreateAnimalRequest request) {
        UUID farmId = getTenantFarmId();
        UUID currentUserId = TenantContext.getUserId();

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm", "id", farmId));

        User currentUser = currentUserId != null
                ? userRepository.findById(currentUserId).orElse(null)
                : null;

        String earTag = request.getTag().trim();

        // 1. Uniqueness check within farm
        if (animalRepository.existsByFarmIdAndEarTag(farmId, earTag)) {
            throw new DuplicateResourceException("Animal with ear tag '" + earTag + "' already exists on this farm");
        }

        // 2. Date Validations
        LocalDate today = LocalDate.now();
        LocalDate birthDate = request.getResolvedBirthDate();
        LocalDate aiDate = request.getResolvedAiDate();
        LocalDate lastVaccinationDate = request.getResolvedLastVaccinationDate();

        if (birthDate != null && birthDate.isAfter(today)) {
            throw new BadRequestException("Birth date cannot be in the future");
        }
        if (aiDate != null) {
            if (aiDate.isAfter(today)) {
                throw new BadRequestException("AI date cannot be in the future");
            }
            if (birthDate != null && aiDate.isBefore(birthDate)) {
                throw new BadRequestException("AI date cannot be earlier than the animal's birth date");
            }
        }
        if (lastVaccinationDate != null) {
            if (lastVaccinationDate.isAfter(today)) {
                throw new BadRequestException("Last vaccination date cannot be in the future");
            }
            if (birthDate != null && lastVaccinationDate.isBefore(birthDate)) {
                throw new BadRequestException("Last vaccination date cannot be earlier than the animal's birth date");
            }
        }

        // 3. Parent Validations and Relationships
        Animal father = null;
        UUID fatherId = request.getResolvedFatherAnimalId();
        String fatherTag = request.getResolvedFatherTag();
        String fatherName = request.getResolvedFatherName();

        if (fatherId != null) {
            father = animalRepository.findByIdAndFarmId(fatherId, farmId)
                    .orElseThrow(() -> new ResourceNotFoundException("Father animal", "id", fatherId));
            fatherTag = father.getEarTag();
            fatherName = father.getAnimalName();
        }
        if (fatherTag != null && fatherTag.equalsIgnoreCase(earTag)) {
            throw new BadRequestException("Father cannot be the same animal being created");
        }

        Animal mother = null;
        UUID motherId = request.getResolvedMotherAnimalId();
        String motherTag = request.getResolvedMotherTag();
        String motherName = request.getResolvedMotherName();

        if (motherId != null) {
            mother = animalRepository.findByIdAndFarmId(motherId, farmId)
                    .orElseThrow(() -> new ResourceNotFoundException("Mother animal", "id", motherId));
            motherTag = mother.getEarTag();
            motherName = mother.getAnimalName();
        }
        if (motherTag != null && motherTag.equalsIgnoreCase(earTag)) {
            throw new BadRequestException("Mother cannot be the same animal being created");
        }

        // Calculate age string if not provided
        String age = request.getAge();
        if ((age == null || age.isBlank()) && birthDate != null) {
            Period period = Period.between(birthDate, today);
            age = String.format("%dy %dm", period.getYears(), period.getMonths());
        }

        Animal animal = Animal.builder()
                .farm(farm)
                .animalName(request.getName().trim())
                .earTag(earTag)
                .breed(request.getBreed().trim())
                .animalType(request.getType() != null ? request.getType() : AnimalType.Lactating)
                .status(request.getStatus() != null ? request.getStatus() : "Healthy")
                .lifecycleStatus(LifecycleStatus.ACTIVE)
                .age(age)
                .weight(request.getWeight())
                .milkYield(request.getYield())
                .pen(request.getPen())
                .lactationCycle(request.getLactationCycle())
                .feedRation(request.getFeedRation())
                .birthDate(birthDate)
                .birthStatus(request.getResolvedBirthStatus())
                .father(father)
                .fatherTag(fatherTag)
                .fatherName(fatherName)
                .mother(mother)
                .motherTag(motherTag)
                .motherName(motherName)
                .aiDate(aiDate)
                .lastVaccinationDate(lastVaccinationDate)
                .active(true)
                .build();

        Animal savedAnimal = animalRepository.save(animal);

        // 4. Record Initial Chronological History Events
        List<AnimalHistory> initialEvents = new ArrayList<>();

        if (birthDate != null) {
            initialEvents.add(AnimalHistory.builder()
                    .animal(savedAnimal)
                    .farm(farm)
                    .eventType(HistoryEventType.BIRTH)
                    .eventDate(birthDate)
                    .title("Birth Recorded")
                    .detail(String.format("Born on farm%s%s",
                            request.getResolvedBirthStatus() != null ? " (" + request.getResolvedBirthStatus() + ")" : "",
                            motherTag != null ? ". Mother: " + motherTag : ""))
                    .badge("Birth")
                    .recordedBy(currentUser)
                    .build());
        }

        initialEvents.add(AnimalHistory.builder()
                .animal(savedAnimal)
                .farm(farm)
                .eventType(HistoryEventType.REGISTRATION)
                .eventDate(today)
                .title("Animal Added to Herd")
                .detail(String.format("%s (%s) registered into the dairy herd database.", savedAnimal.getAnimalName(), savedAnimal.getEarTag()))
                .badge("Registered")
                .recordedBy(currentUser)
                .build());

        if (lastVaccinationDate != null) {
            initialEvents.add(AnimalHistory.builder()
                    .animal(savedAnimal)
                    .farm(farm)
                    .eventType(HistoryEventType.VACCINATION)
                    .eventDate(lastVaccinationDate)
                    .title("Vaccination Verified")
                    .detail("Prior vaccination verified and recorded at animal registration.")
                    .badge("Vaccinated")
                    .recordedBy(currentUser)
                    .build());
        }

        if (aiDate != null) {
            initialEvents.add(AnimalHistory.builder()
                    .animal(savedAnimal)
                    .farm(farm)
                    .eventType(HistoryEventType.AI)
                    .eventDate(aiDate)
                    .title("Artificial Insemination (AI)")
                    .detail(String.format("Insemination recorded on %s%s.",
                            aiDate,
                            fatherTag != null ? " with Sire: " + fatherTag : ""))
                    .badge("AI Done")
                    .recordedBy(currentUser)
                    .build());
        }

        historyRepository.saveAll(initialEvents);
        savedAnimal.setHistoryList(initialEvents);

        auditService.record("CREATE_ANIMAL", "ANIMAL", savedAnimal.getId().toString(),
                "Registered animal " + savedAnimal.getAnimalName() + " (" + savedAnimal.getEarTag() + ")");

        return AnimalDto.fromEntity(savedAnimal);
    }

    @Transactional
    public AnimalDto updateAnimal(UUID animalId, UpdateAnimalRequest request) {
        UUID farmId = getTenantFarmId();
        Animal animal = animalRepository.findByIdAndFarmId(animalId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Animal", "id", animalId));

        LocalDate today = LocalDate.now();

        // 1. Tag Update & Uniqueness Validation
        if (request.getTag() != null && !request.getTag().isBlank()) {
            String newTag = request.getTag().trim().toUpperCase();
            if (!newTag.equalsIgnoreCase(animal.getEarTag())) {
                if (animalRepository.existsByFarmIdAndEarTagAndIdNot(farmId, newTag, animalId)) {
                    throw new DuplicateResourceException("Animal with ear tag '" + newTag + "' already exists on this farm");
                }
                animal.setEarTag(newTag);
            }
        }

        // 2. Name & Basic Properties
        if (request.getName() != null && !request.getName().isBlank()) {
            animal.setAnimalName(request.getName().trim());
        }
        if (request.getBreed() != null && !request.getBreed().isBlank()) {
            animal.setBreed(request.getBreed().trim());
        }
        if (request.getType() != null) {
            animal.setAnimalType(request.getType());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            animal.setStatus(request.getStatus().trim());
        }
        if (request.getWeight() != null) {
            animal.setWeight(request.getWeight());
        }
        if (request.getYield() != null) {
            animal.setMilkYield(request.getYield());
        }
        if (request.getPen() != null) {
            animal.setPen(request.getPen());
        }
        if (request.getLactationCycle() != null) {
            animal.setLactationCycle(request.getLactationCycle());
        }
        if (request.getFeedRation() != null) {
            animal.setFeedRation(request.getFeedRation());
        }
        if (request.getDueDate() != null) {
            animal.setDueDate(request.getDueDate());
        }

        // 3. Birth Date & Age
        if (request.getBirthDate() != null) {
            if (request.getBirthDate().isAfter(today)) {
                throw new BadRequestException("Birth date cannot be in the future");
            }
            animal.setBirthDate(request.getBirthDate());
            if (request.getAge() == null || request.getAge().isBlank()) {
                Period period = Period.between(request.getBirthDate(), today);
                animal.setAge(String.format("%dy %dm", period.getYears(), period.getMonths()));
            }
        }
        if (request.getAge() != null && !request.getAge().isBlank()) {
            animal.setAge(request.getAge());
        }
        if (request.getBirthStatus() != null) {
            animal.setBirthStatus(request.getBirthStatus());
        }

        // 4. Parents
        if (request.getFatherAnimalId() != null) {
            if (request.getFatherAnimalId().equals(animalId)) {
                throw new BadRequestException("Animal cannot be its own father");
            }
            Animal father = animalRepository.findByIdAndFarmId(request.getFatherAnimalId(), farmId)
                    .orElseThrow(() -> new ResourceNotFoundException("Father animal", "id", request.getFatherAnimalId()));
            animal.setFather(father);
            animal.setFatherTag(father.getEarTag());
            animal.setFatherName(father.getAnimalName());
        } else if (request.getFatherTag() != null) {
            animal.setFather(null);
            animal.setFatherTag(request.getFatherTag().trim());
            animal.setFatherName(request.getFatherName());
        }

        if (request.getMotherAnimalId() != null) {
            if (request.getMotherAnimalId().equals(animalId)) {
                throw new BadRequestException("Animal cannot be its own mother");
            }
            Animal mother = animalRepository.findByIdAndFarmId(request.getMotherAnimalId(), farmId)
                    .orElseThrow(() -> new ResourceNotFoundException("Mother animal", "id", request.getMotherAnimalId()));
            animal.setMother(mother);
            animal.setMotherTag(mother.getEarTag());
            animal.setMotherName(mother.getAnimalName());
        } else if (request.getMotherTag() != null) {
            animal.setMother(null);
            animal.setMotherTag(request.getMotherTag().trim());
            animal.setMotherName(request.getMotherName());
        }

        // 5. AI, Vaccination, and Health Dates
        if (request.getAiDate() != null) {
            if (request.getAiDate().isAfter(today)) {
                throw new BadRequestException("AI date cannot be in the future");
            }
            if (animal.getBirthDate() != null && request.getAiDate().isBefore(animal.getBirthDate())) {
                throw new BadRequestException("AI date cannot be earlier than the animal's birth date");
            }
            animal.setAiDate(request.getAiDate());
        }
        if (request.getLastVaccinationDate() != null) {
            if (request.getLastVaccinationDate().isAfter(today)) {
                throw new BadRequestException("Last vaccination date cannot be in the future");
            }
            if (animal.getBirthDate() != null && request.getLastVaccinationDate().isBefore(animal.getBirthDate())) {
                throw new BadRequestException("Last vaccination date cannot be earlier than the animal's birth date");
            }
            animal.setLastVaccinationDate(request.getLastVaccinationDate());
        }
        if (request.getLastHealthCheck() != null) {
            if (request.getLastHealthCheck().isAfter(today)) {
                throw new BadRequestException("Last health check date cannot be in the future");
            }
            animal.setLastHealthCheck(request.getLastHealthCheck());
        }

        // 6. Lifecycle & Active Status
        if (request.getLifecycleStatus() != null) {
            animal.setLifecycleStatus(request.getLifecycleStatus());
            if (request.getLifecycleStatus() == LifecycleStatus.SOLD ||
                request.getLifecycleStatus() == LifecycleStatus.DECEASED ||
                request.getLifecycleStatus() == LifecycleStatus.RETIRED ||
                request.getLifecycleStatus() == LifecycleStatus.ARCHIVED) {
                animal.setActive(false);
            } else if (request.getLifecycleStatus() == LifecycleStatus.ACTIVE ||
                       request.getLifecycleStatus() == LifecycleStatus.SICK) {
                animal.setActive(true);
            }
        }
        if (request.getActive() != null) {
            animal.setActive(request.getActive());
        }

        Animal updated = animalRepository.save(animal);
        auditService.record("UPDATE_ANIMAL", "ANIMAL", updated.getId().toString(),
                "Updated animal details for " + updated.getEarTag() + " (" + updated.getAnimalName() + ")");

        return AnimalDto.fromEntity(updated);
    }

    @Transactional
    public AnimalDto changeLifecycleStatus(UUID animalId, ChangeLifecycleStatusRequest request) {
        UUID farmId = getTenantFarmId();
        Animal animal = animalRepository.findByIdAndFarmId(animalId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Animal", "id", animalId));

        UUID currentUserId = TenantContext.getUserId();
        User currentUser = currentUserId != null
                ? userRepository.findById(currentUserId).orElse(null)
                : null;

        LifecycleStatus oldStatus = animal.getLifecycleStatus();
        LifecycleStatus newStatus = request.getStatus();
        LocalDate effectiveDate = request.getEffectiveDate() != null ? request.getEffectiveDate() : LocalDate.now();

        if (effectiveDate.isAfter(LocalDate.now())) {
            throw new BadRequestException("Lifecycle effective date cannot be in the future");
        }

        animal.setLifecycleStatus(newStatus);
        animal.setLifecycleDate(effectiveDate);
        animal.setLifecycleReason(request.getReason());
        animal.setLifecycleNotes(request.getNotes());

        // Inactivate if terminal/retired/archived, reactivate if active/sick
        if (newStatus == LifecycleStatus.DECEASED ||
            newStatus == LifecycleStatus.SOLD ||
            newStatus == LifecycleStatus.RETIRED ||
            newStatus == LifecycleStatus.ARCHIVED) {
            animal.setActive(false);
        } else if (newStatus == LifecycleStatus.ACTIVE || newStatus == LifecycleStatus.SICK) {
            animal.setActive(true);
        }

        Animal saved = animalRepository.save(animal);

        // Record History Entry
        HistoryEventType eventType = switch (newStatus) {
            case DECEASED -> HistoryEventType.DEATH;
            case SOLD -> HistoryEventType.SALE;
            case RETIRED -> HistoryEventType.RETIREMENT;
            default -> HistoryEventType.LIFECYCLE_CHANGE;
        };

        String title = switch (newStatus) {
            case DECEASED -> "Animal Deceased";
            case SOLD -> "Animal Sold";
            case RETIRED -> "Animal Retired";
            case ARCHIVED -> "Animal Archived";
            case SICK -> "Status: Sick";
            case ACTIVE -> "Reactivated in Herd";
        };

        StringBuilder detailBuilder = new StringBuilder();
        detailBuilder.append(String.format("Status changed from %s to %s effective %s.", oldStatus, newStatus, effectiveDate));
        if (request.getReason() != null && !request.getReason().isBlank()) {
            detailBuilder.append(" Reason: ").append(request.getReason().trim());
        }
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            detailBuilder.append(" Notes: ").append(request.getNotes().trim());
        }

        AnimalHistory history = AnimalHistory.builder()
                .animal(saved)
                .farm(saved.getFarm())
                .eventType(eventType)
                .eventDate(effectiveDate)
                .title(title)
                .detail(detailBuilder.toString())
                .badge(newStatus.name())
                .recordedBy(currentUser)
                .build();

        historyRepository.save(history);

        auditService.record("CHANGE_LIFECYCLE", "ANIMAL", saved.getId().toString(),
                "Changed lifecycle of animal " + saved.getEarTag() + " to " + newStatus.name());

        return AnimalDto.fromEntity(saved);
    }

    @Transactional
    public void deactivateAnimal(UUID animalId) {
        UUID farmId = getTenantFarmId();
        Animal animal = animalRepository.findByIdAndFarmId(animalId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Animal", "id", animalId));

        animal.setActive(false);
        animal.setLifecycleStatus(LifecycleStatus.ARCHIVED);
        animal.setLifecycleDate(LocalDate.now());
        animal.setLifecycleReason("Deactivated / Archived by user");
        animalRepository.save(animal);

        auditService.record("DEACTIVATE_ANIMAL", "ANIMAL", animalId.toString(),
                "Deactivated/archived animal " + animal.getEarTag());
    }

    @Transactional(readOnly = true)
    public List<AnimalHistoryDto> getAnimalHistory(UUID animalId) {
        UUID farmId = getTenantFarmId();
        animalRepository.findByIdAndFarmId(animalId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Animal", "id", animalId));

        return historyRepository.findByAnimalIdAndFarmIdOrderByEventDateDescCreatedAtDesc(animalId, farmId).stream()
                .map(AnimalHistoryDto::fromEntity)
                .toList();
    }

    @Transactional
    public AnimalHistoryDto addHistoryEvent(UUID animalId, CreateHistoryEventRequest request) {
        UUID farmId = getTenantFarmId();
        Animal animal = animalRepository.findByIdAndFarmId(animalId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Animal", "id", animalId));

        UUID currentUserId = TenantContext.getUserId();
        User currentUser = currentUserId != null
                ? userRepository.findById(currentUserId).orElse(null)
                : null;

        if (animal.getBirthDate() != null && request.getEventDate().isBefore(animal.getBirthDate())) {
            throw new BadRequestException("Event date cannot be earlier than the animal's birth date");
        }

        AnimalHistory history = AnimalHistory.builder()
                .animal(animal)
                .farm(animal.getFarm())
                .eventType(request.getEventType())
                .eventDate(request.getEventDate())
                .title(request.getTitle())
                .detail(request.getDetail())
                .badge(request.getBadge())
                .recordedBy(currentUser)
                .build();

        AnimalHistory saved = historyRepository.save(history);
        auditService.record("ADD_ANIMAL_HISTORY", "ANIMAL_HISTORY", saved.getId().toString(),
                "Added history event " + saved.getTitle() + " for animal " + animal.getEarTag());

        return AnimalHistoryDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AnimalMilkRecordDto> getAnimalMilkRecords(UUID animalId) {
        UUID farmId = getTenantFarmId();
        animalRepository.findByIdAndFarmId(animalId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Animal", "id", animalId));

        return milkRecordRepository.findByFarmIdAndAnimalIdOrderByRecordDateDescCreatedAtDesc(farmId, animalId).stream()
                .map(AnimalMilkRecordDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AnimalFeedRecordDto> getAnimalFeedRecords(UUID animalId) {
        UUID farmId = getTenantFarmId();
        animalRepository.findByIdAndFarmId(animalId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Animal", "id", animalId));

        return feedRecordRepository.findByFarmIdAndAnimalIdOrderByRecordDateDescCreatedAtDesc(farmId, animalId).stream()
                .map(AnimalFeedRecordDto::fromEntity)
                .toList();
    }

    private UUID getTenantFarmId() {
        UUID farmId = TenantContext.getFarmId();
        if (farmId == null) {
            throw new BadRequestException("No tenant farm context found for the current request");
        }
        return farmId;
    }
}
