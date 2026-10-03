package com.dairyfarm.app.modules.farm.dto;

import com.dairyfarm.app.modules.farm.model.Farm;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmDto {

    private UUID id;
    private String name;
    private String code;
    private String address;
    private String city;
    private String state;
    private String country;
    private String contactNumber;
    private String email;
    private boolean active;

    public static FarmDto fromEntity(Farm farm) {
        if (farm == null) return null;
        return FarmDto.builder()
                .id(farm.getId())
                .name(farm.getName())
                .code(farm.getCode())
                .address(farm.getAddress())
                .city(farm.getCity())
                .state(farm.getState())
                .country(farm.getCountry())
                .contactNumber(farm.getContactNumber())
                .email(farm.getEmail())
                .active(farm.isActive())
                .build();
    }
}
