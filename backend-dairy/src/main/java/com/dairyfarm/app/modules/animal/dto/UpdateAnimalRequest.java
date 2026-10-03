package com.dairyfarm.app.modules.animal.dto;

import com.dairyfarm.app.modules.animal.model.AnimalType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAnimalRequest {

    private String name;
    private String breed;
    private AnimalType type;
    private String status;
    private String age;
    private BigDecimal weight;
    private BigDecimal yield;
    private String pen;
    private Integer lactationCycle;
    private String feedRation;
    private LocalDate dueDate;
    private Boolean active;
}
