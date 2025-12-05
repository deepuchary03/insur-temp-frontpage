package com.insurance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIQueryResponse {
    
    private String answer;
    private String category;
    private Integer responseTime;
    private Boolean canBookAppointment;
    private String suggestedAction;
}
