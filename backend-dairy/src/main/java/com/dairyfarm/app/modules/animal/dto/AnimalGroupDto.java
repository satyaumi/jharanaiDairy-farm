package com.dairyfarm.app.modules.animal.dto;

import com.dairyfarm.app.modules.animal.model.AnimalGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnimalGroupDto {
    private UUID id;
    private String name;
    private String code;
    private String description;
    private boolean active;
    private long animalCount;

    public static AnimalGroupDto fromEntity(AnimalGroup g, long count) {
        if (g == null) return null;
        return AnimalGroupDto.builder()
                .id(g.getId())
                .name(g.getName())
                .code(g.getCode())
                .description(g.getDescription())
                .active(g.isActive())
                .animalCount(count)
                .build();
    }
}
