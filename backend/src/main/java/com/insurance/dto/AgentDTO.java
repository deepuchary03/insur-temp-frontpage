package com.insurance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentDTO {
    
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String specialization;
    private String bio;
    private String profileImage;
    private Integer experienceYears;
    private Double rating;
    private Integer totalAppointments;
    private Boolean isAvailable;
}
