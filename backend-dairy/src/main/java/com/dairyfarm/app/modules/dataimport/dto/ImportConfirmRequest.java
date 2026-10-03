package com.dairyfarm.app.modules.dataimport.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportConfirmRequest {

    @NotBlank
    private String recordType; // MILK_RECORD, COW_RECORD, FEED_RECORD

    private String fileName;

    @Builder.Default
    private boolean importOnlyValid = true;

    private Map<String, String> mappings; // header -> standardField

    @NotEmpty
    private List<Map<String, String>> rows;
}
