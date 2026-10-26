package com.dairyfarm.app.modules.animal.dto;

import com.dairyfarm.app.modules.animal.model.AnimalType;
import com.dairyfarm.app.modules.animal.model.LifecycleStatus;
import com.fasterxml.jackson.annotation.JsonAlias;
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
public class UpdateAnimalRequest {

    @JsonAlias({"animalName"})
    private String name;

    @JsonAlias({"animalNumber", "earTag", "cowNumber", "cowNo"})
    private String tag;
    private String breed;
    private AnimalType type;
    private String status;
    private LifecycleStatus lifecycleStatus;
    private String age;
    private BigDecimal weight;
    private BigDecimal yield;
    private String pen;
    private UUID groupId;
    private String groupName;
    private Integer lactationCycle;
    private String feedRation;
    private LocalDate dueDate;
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
    private LocalDate lastHealthCheck;
    private Boolean active;
}
