package com.insurance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsDTO {
    
    private Long totalAppointments;
    private Long pendingAppointments;
    private Long confirmedAppointments;
    private Long completedAppointments;
    private Long cancelledAppointments;
    
    private Long totalUsers;
    private Long totalAgents;
    private Long totalPolicies;
    private Long totalAIQueries;
    
    private Map<String, Long> appointmentsByType;
    private Map<String, Long> appointmentsByAgent;
    private Map<String, Long> appointmentsByMonth;
    private Map<String, Long> appointmentsByStatus;
    
    private List<AppointmentDTO> recentAppointments;
    private List<Map<String, Object>> weeklyStats;
    private List<Map<String, Object>> monthlyStats;
    
    private Map<String, Long> aiQueryCategories;
    private Double averageResponseTime;
}
