package com.insurance.dto;

import com.insurance.entity.Appointment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentDTO {
    
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private Long agentId;
    private String agentName;
    private String agentSpecialization;
    private LocalDateTime appointmentDateTime;
    private Appointment.AppointmentStatus status;
    private Appointment.AppointmentType type;
    private String notes;
    private String cancellationReason;
    private LocalDateTime createdAt;
}
