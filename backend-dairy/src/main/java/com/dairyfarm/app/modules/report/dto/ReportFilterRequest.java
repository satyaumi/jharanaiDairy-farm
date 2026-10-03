package com.dairyfarm.app.modules.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportFilterRequest {

    private String module; // milk, cows, feeding, health, production, stock, summary
    private String format; // csv, xlsx, pdf

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDate;

    private String cowTag;
    private String shift; // Morning, Evening, Afternoon, All
    private String status; // Healthy, Sick, etc.
    private Integer limit; // e.g. 10, 25, 50, 100, or null for all
    private String recordScope; // all, individual, custom
}
