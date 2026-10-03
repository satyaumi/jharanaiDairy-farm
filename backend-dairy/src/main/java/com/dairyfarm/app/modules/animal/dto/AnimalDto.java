package com.dairyfarm.app.modules.animal.dto;

import com.dairyfarm.app.modules.animal.model.Animal;
import com.dairyfarm.app.modules.animal.model.AnimalType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
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
    private String age;
    private BigDecimal weight;
    private BigDecimal yield;
    private String pen;
    private Integer lactationCycle;
    private String feedRation;

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

    public static AnimalDto fromEntity(Animal animal) {
        if (animal == null) return null;

        List<AnimalHistoryDto> historyDtos = new ArrayList<>();
        if (animal.getHistoryList() != null) {
            historyDtos = animal.getHistoryList().stream()
                    .map(AnimalHistoryDto::fromEntity)
                    .toList();
        }

        return AnimalDto.builder()
                .id(animal.getId())
                .name(animal.getAnimalName())
                .tag(animal.getEarTag())
                .breed(animal.getBreed())
                .type(animal.getAnimalType())
                .status(animal.getStatus())
                .age(animal.getAge())
                .weight(animal.getWeight())
                .yield(animal.getMilkYield())
                .pen(animal.getPen())
                .lactationCycle(animal.getLactationCycle())
                .feedRation(animal.getFeedRation())
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
                .active(animal.isActive())
                .timeline(historyDtos)
                .build();
    }
}
