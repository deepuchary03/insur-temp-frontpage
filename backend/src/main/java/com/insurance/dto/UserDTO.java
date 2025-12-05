package com.insurance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    
    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String address;
    private Boolean isActive;
    private Set<String> roles;
    private LocalDateTime createdAt;
}
