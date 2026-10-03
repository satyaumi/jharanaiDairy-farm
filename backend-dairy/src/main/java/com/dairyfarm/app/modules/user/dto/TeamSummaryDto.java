package com.dairyfarm.app.modules.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamSummaryDto {

    private long totalMembers;
    private long managementCount;
    private long workerCount;
    private long activeCount;
    private long pendingCount;
}
