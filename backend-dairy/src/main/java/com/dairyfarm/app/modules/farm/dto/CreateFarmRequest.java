package com.dairyfarm.app.modules.farm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFarmRequest {

    @NotBlank(message = "Farm name is required")
    private String name;

    private String code;
    private String address;
    private String city;
    private String state;
    private String country;
    private String contactNumber;
    private String email;
}
