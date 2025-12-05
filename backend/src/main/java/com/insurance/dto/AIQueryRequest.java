package com.insurance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIQueryRequest {
    
    @NotBlank(message = "Question is required")
    private String question;
    
    private Boolean isVoiceQuery = false;
    
    private Long userId;
}
