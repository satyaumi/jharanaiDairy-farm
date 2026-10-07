package com.dairyfarm.app.modules.animal.dto;

import com.dairyfarm.app.modules.animal.model.AnimalType;
import com.dairyfarm.app.modules.animal.model.LifecycleStatus;
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

    private String name;
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
