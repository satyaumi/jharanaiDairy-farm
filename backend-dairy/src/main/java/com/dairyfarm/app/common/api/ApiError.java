package com.dairyfarm.app.common.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiError {

    @Builder.Default
    private boolean success = false;

    private String message;

    private String code;

    private List<String> details;

    @Builder.Default
    private Instant timestamp = Instant.now();

    public static ApiError of(String message, String code) {
        return ApiError.builder()
                .success(false)
                .message(message)
                .code(code)
                .build();
    }

    public static ApiError of(String message, String code, List<String> details) {
        return ApiError.builder()
                .success(false)
                .message(message)
                .code(code)
                .details(details)
                .build();
    }
}
