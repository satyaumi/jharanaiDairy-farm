package com.dairyfarm.app.modules.animal.dto;

import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.animal.model.AnimalType;
import com.dairyfarm.app.modules.animal.model.LifecycleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnimalDto {

    private UUID id;
    private String name;
    private String tag;
    private String breed;
    private AnimalType type;
    private String status;
    private LifecycleStatus lifecycleStatus;
    private LocalDate lifecycleDate;
    private String lifecycleReason;
    private String lifecycleNotes;
    private String age;
    private BigDecimal weight;
    private BigDecimal yield;
    private String pen;
    private UUID groupId;
    private String groupName;
    private Integer lactationCycle;
    private String feedRation;
    private LocalDate dueDate;
    private Instant lastMilkingDate;
    private LocalDate lastHealthCheck;

    private LocalDate lastCalvingDate;
    private String milkingStatus;
    private String animalStatusCategory;
    private String photoUrl;
    private String vaccinationStatus;
    private String lastVaccineName;
    private LocalDate heatDate;
    private Integer aiAttemptsCount;
    private Boolean aiSuccess;
    private String bullUsed;
    private LocalDate dryingDate;
    private LocalDate calfDob;
    private String calfSex;
    private BigDecimal bestYield;
    private String medicineUsed;
    private String medicineDose;
    private Integer gestationDays;
    private Integer interCalvingDays;
    private String remarks;

    // Animal History details
    private LocalDate birthDate;
    private String birthStatus;
    private UUID fatherAnimalId;
    private String fatherTag;
    private String fatherName;
    private UUID motherAnimalId;
    private String motherTag;
    private String motherName;
    private LocalDate aiDate;
    private LocalDate lastVaccinationDate;

    private boolean active;

    @Builder.Default
    private List<AnimalHistoryDto> timeline = new ArrayList<>();

    public static String calculateAgeDisplay(LocalDate birthDate, String fallbackAge) {
        if (birthDate == null) {
            return (fallbackAge != null && !fallbackAge.isBlank()) ? fallbackAge : "Unknown";
        }
        LocalDate now = LocalDate.now();
        if (birthDate.isAfter(now)) {
            return "Invalid (Future Date)";
        }
        java.time.Period period = java.time.Period.between(birthDate, now);
        int years = period.getYears();
        int months = period.getMonths();
        int days = period.getDays();

        if (years > 0 && months > 0) {
            return years + (years == 1 ? " year, " : " years, ") + months + (months == 1 ? " month" : " months");
        } else if (years > 0) {
            return years + (years == 1 ? " year" : " years");
        } else if (months > 0) {
            return months + (months == 1 ? " month" : " months");
        } else {
            return days + (days == 1 ? " day" : " days");
        }
    }

    public static AnimalDto fromEntity(Animal animal) {
        if (animal == null) return null;

        List<AnimalHistoryDto> historyDtos = new ArrayList<>();
        if (animal.getHistoryList() != null) {
            historyDtos = animal.getHistoryList().stream()
                    .map(AnimalHistoryDto::fromEntity)
                    .toList();
        }

        String calculatedAge = calculateAgeDisplay(animal.getBirthDate(), animal.getAge());

        return AnimalDto.builder()
                .id(animal.getId())
                .name(animal.getAnimalName())
                .tag(animal.getEarTag())
                .breed(animal.getBreed())
                .type(animal.getAnimalType())
                .status(animal.getStatus())
                .lifecycleStatus(animal.getLifecycleStatus())
                .lifecycleDate(animal.getLifecycleDate())
                .lifecycleReason(animal.getLifecycleReason())
                .lifecycleNotes(animal.getLifecycleNotes())
                .age(calculatedAge)
                .weight(animal.getWeight())
                .yield(animal.getMilkYield())
                .pen(animal.getPen())
                .groupId(animal.getGroup() != null ? animal.getGroup().getId() : null)
                .groupName(animal.getGroup() != null ? animal.getGroup().getName() : (animal.getPen() != null ? animal.getPen() : null))
                .lactationCycle(animal.getLactationCycle())
                .feedRation(animal.getFeedRation())
                .dueDate(animal.getDueDate())
                .lastMilkingDate(animal.getLastMilkingDate())
                .lastHealthCheck(animal.getLastHealthCheck())
                .birthDate(animal.getBirthDate())
                .birthStatus(animal.getBirthStatus())
                .fatherAnimalId(animal.getFather() != null ? animal.getFather().getId() : null)
                .fatherTag(animal.getFatherTag() != null ? animal.getFatherTag() : (animal.getFather() != null ? animal.getFather().getEarTag() : null))
                .fatherName(animal.getFatherName() != null ? animal.getFatherName() : (animal.getFather() != null ? animal.getFather().getAnimalName() : null))
                .motherAnimalId(animal.getMother() != null ? animal.getMother().getId() : null)
                .motherTag(animal.getMotherTag() != null ? animal.getMotherTag() : (animal.getMother() != null ? animal.getMother().getEarTag() : null))
                .motherName(animal.getMotherName() != null ? animal.getMotherName() : (animal.getMother() != null ? animal.getMother().getAnimalName() : null))
                .aiDate(animal.getAiDate())
                .lastVaccinationDate(animal.getLastVaccinationDate())
                .lastCalvingDate(animal.getLastCalvingDate())
                .milkingStatus(animal.getMilkingStatus())
                .animalStatusCategory(animal.getAnimalStatusCategory())
                .photoUrl(animal.getPhotoUrl())
                .vaccinationStatus(animal.getVaccinationStatus())
                .lastVaccineName(animal.getLastVaccineName())
                .heatDate(animal.getHeatDate())
                .aiAttemptsCount(animal.getAiAttemptsCount())
                .aiSuccess(animal.getAiSuccess())
                .bullUsed(animal.getBullUsed())
                .dryingDate(animal.getDryingDate())
                .calfDob(animal.getCalfDob())
                .calfSex(animal.getCalfSex())
                .bestYield(animal.getBestYield())
                .medicineUsed(animal.getMedicineUsed())
                .medicineDose(animal.getMedicineDose())
                .gestationDays(animal.getGestationDays())
                .interCalvingDays(animal.getInterCalvingDays())
                .remarks(animal.getRemarks())
                .active(animal.isActive())
                .timeline(historyDtos)
                .build();
    }
}
