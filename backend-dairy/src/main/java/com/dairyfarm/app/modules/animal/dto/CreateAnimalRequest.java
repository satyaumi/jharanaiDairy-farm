package com.dairyfarm.app.modules.animal.dto;

import com.dairyfarm.app.modules.animal.model.AnimalType;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAnimalRequest {

    // 1. FAST 1-MINUTE ENTRY FIELDS (Mandatory for farmer workflow)
    @NotBlank(message = "Animal name is required")
    @JsonAlias({"animalName"})
    private String name;

    @NotBlank(message = "Ear tag / animal number is required")
    @JsonAlias({"animalNumber", "earTag"})
    private String tag;

    @NotBlank(message = "Breed is required")
    private String breed;

    // Optional operational defaults
    @Builder.Default
    private AnimalType type = AnimalType.Lactating;

    @Builder.Default
    private String status = "Healthy";

    private String age;

    @Builder.Default
    private BigDecimal weight = BigDecimal.valueOf(560);

    @Builder.Default
    private BigDecimal yield = BigDecimal.ZERO;

    @Builder.Default
    private String pen = "North barn";

    @Builder.Default
    private Integer lactationCycle = 1;

    private String feedRation;

    // 2. OPTIONAL HISTORY SECTION (Flat representation)
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

    // Support nested history payload if sent by structured clients
    private NestedHistory history;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NestedHistory {
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
    }

    public LocalDate getResolvedBirthDate() {
        if (birthDate != null) return birthDate;
        return history != null ? history.getBirthDate() : null;
    }

    public String getResolvedBirthStatus() {
        if (birthStatus != null) return birthStatus;
        return history != null ? history.getBirthStatus() : null;
    }

    public UUID getResolvedFatherAnimalId() {
        if (fatherAnimalId != null) return fatherAnimalId;
        return history != null ? history.getFatherAnimalId() : null;
    }

    public String getResolvedFatherTag() {
        if (fatherTag != null) return fatherTag;
        return history != null ? history.getFatherTag() : null;
    }

    public String getResolvedFatherName() {
        if (fatherName != null) return fatherName;
        return history != null ? history.getFatherName() : null;
    }

    public UUID getResolvedMotherAnimalId() {
        if (motherAnimalId != null) return motherAnimalId;
        return history != null ? history.getMotherAnimalId() : null;
    }

    public String getResolvedMotherTag() {
        if (motherTag != null) return motherTag;
        return history != null ? history.getMotherTag() : null;
    }

    public String getResolvedMotherName() {
        if (motherName != null) return motherName;
        return history != null ? history.getMotherName() : null;
    }

    public LocalDate getResolvedAiDate() {
        if (aiDate != null) return aiDate;
        return history != null ? history.getAiDate() : null;
    }

    public LocalDate getResolvedLastVaccinationDate() {
        if (lastVaccinationDate != null) return lastVaccinationDate;
        return history != null ? history.getLastVaccinationDate() : null;
    }
}
