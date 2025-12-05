package com.insurance.service;

import com.insurance.dto.AnalyticsDTO;
import com.insurance.dto.AppointmentDTO;
import com.insurance.entity.Appointment;
import com.insurance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AgentRepository agentRepository;
    
    @Autowired
    private InsurancePolicyRepository policyRepository;
    
    @Autowired
    private AIQueryLogRepository queryLogRepository;
    
    @Autowired
    private AppointmentService appointmentService;
    
    public AnalyticsDTO getAdminAnalytics() {
        // Get totals
        Long totalAppointments = appointmentRepository.count();
        Long totalUsers = userRepository.count();
        Long totalAgents = agentRepository.count();
        Long totalPolicies = policyRepository.count();
        Long totalAIQueries = queryLogRepository.count();
        
        // Get appointments by status
        Long pendingAppointments = appointmentRepository.countByStatus(Appointment.AppointmentStatus.PENDING);
        Long confirmedAppointments = appointmentRepository.countByStatus(Appointment.AppointmentStatus.CONFIRMED);
        Long completedAppointments = appointmentRepository.countByStatus(Appointment.AppointmentStatus.COMPLETED);
        Long cancelledAppointments = appointmentRepository.countByStatus(Appointment.AppointmentStatus.CANCELLED);
        
        // Get appointments by type
        Map<String, Long> appointmentsByType = new HashMap<>();
        for (Appointment.AppointmentType type : Appointment.AppointmentType.values()) {
            appointmentsByType.put(type.name(), appointmentRepository.countByType(type));
        }
        
        // Get appointments by agent
        Map<String, Long> appointmentsByAgent = new HashMap<>();
        agentRepository.findAll().forEach(agent -> {
            Long count = appointmentRepository.countByAgentId(agent.getId());
            appointmentsByAgent.put(agent.getUser().getFullName(), count);
        });
        
        // Get appointments by status for pie chart
        Map<String, Long> appointmentsByStatus = new HashMap<>();
        appointmentsByStatus.put("PENDING", pendingAppointments);
        appointmentsByStatus.put("CONFIRMED", confirmedAppointments);
        appointmentsByStatus.put("COMPLETED", completedAppointments);
        appointmentsByStatus.put("CANCELLED", cancelledAppointments);
        
        // Get recent appointments
        List<AppointmentDTO> recentAppointments = appointmentRepository.findRecentAppointments()
                .stream()
                .limit(10)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        // Get weekly stats
        List<Map<String, Object>> weeklyStats = getWeeklyStats();
        
        // Get monthly stats
        List<Map<String, Object>> monthlyStats = getMonthlyStats();
        
        // Get AI query categories
        Map<String, Long> aiQueryCategories = new HashMap<>();
        List<Object[]> categoryResults = queryLogRepository.countByCategory();
        categoryResults.forEach(result -> {
            String category = (String) result[0];
            Long count = (Long) result[1];
            aiQueryCategories.put(category, count);
        });
        
        // Get average response time
        Double averageResponseTime = queryLogRepository.getAverageResponseTime();
        
        return AnalyticsDTO.builder()
                .totalAppointments(totalAppointments)
                .pendingAppointments(pendingAppointments)
                .confirmedAppointments(confirmedAppointments)
                .completedAppointments(completedAppointments)
                .cancelledAppointments(cancelledAppointments)
                .totalUsers(totalUsers)
                .totalAgents(totalAgents)
                .totalPolicies(totalPolicies)
                .totalAIQueries(totalAIQueries)
                .appointmentsByType(appointmentsByType)
                .appointmentsByAgent(appointmentsByAgent)
                .appointmentsByStatus(appointmentsByStatus)
                .recentAppointments(recentAppointments)
                .weeklyStats(weeklyStats)
                .monthlyStats(monthlyStats)
                .aiQueryCategories(aiQueryCategories)
                .averageResponseTime(averageResponseTime)
                .build();
    }
    
    private List<Map<String, Object>> getWeeklyStats() {
        List<Map<String, Object>> weeklyStats = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = now.minusDays(i).truncatedTo(ChronoUnit.DAYS);
            LocalDateTime dayEnd = dayStart.plusDays(1);
            
            List<Appointment> appointments = appointmentRepository.findByDateRange(dayStart, dayEnd);
            
            Map<String, Object> dayStat = new HashMap<>();
            dayStat.put("date", dayStart.toLocalDate().toString());
            dayStat.put("day", dayStart.getDayOfWeek().toString());
            dayStat.put("total", (long) appointments.size());
            dayStat.put("confirmed", appointments.stream()
                    .filter(a -> a.getStatus() == Appointment.AppointmentStatus.CONFIRMED)
                    .count());
            dayStat.put("pending", appointments.stream()
                    .filter(a -> a.getStatus() == Appointment.AppointmentStatus.PENDING)
                    .count());
            dayStat.put("cancelled", appointments.stream()
                    .filter(a -> a.getStatus() == Appointment.AppointmentStatus.CANCELLED)
                    .count());
            
            weeklyStats.add(dayStat);
        }
        
        return weeklyStats;
    }
    
    private List<Map<String, Object>> getMonthlyStats() {
        List<Map<String, Object>> monthlyStats = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (int i = 11; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
            LocalDateTime monthEnd = monthStart.plusMonths(1);
            
            List<Appointment> appointments = appointmentRepository.findByDateRange(monthStart, monthEnd);
            
            Map<String, Object> monthStat = new HashMap<>();
            monthStat.put("month", monthStart.getMonth().toString());
            monthStat.put("year", monthStart.getYear());
            monthStat.put("total", (long) appointments.size());
            monthStat.put("completed", appointments.stream()
                    .filter(a -> a.getStatus() == Appointment.AppointmentStatus.COMPLETED)
                    .count());
            
            monthlyStats.add(monthStat);
        }
        
        return monthlyStats;
    }
    
    public Map<String, Long> getAppointmentsByMonth() {
        Map<String, Long> monthlyData = new LinkedHashMap<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
            LocalDateTime monthEnd = monthStart.plusMonths(1);
            
            List<Appointment> appointments = appointmentRepository.findByDateRange(monthStart, monthEnd);
            String monthKey = monthStart.getMonth().toString().substring(0, 3) + " " + monthStart.getYear();
            monthlyData.put(monthKey, (long) appointments.size());
        }
        
        return monthlyData;
    }
    
    private AppointmentDTO convertToDTO(Appointment appointment) {
        return AppointmentDTO.builder()
                .id(appointment.getId())
                .customerId(appointment.getCustomer().getId())
                .customerName(appointment.getCustomer().getFullName())
                .customerEmail(appointment.getCustomer().getEmail())
                .agentId(appointment.getAgent().getId())
                .agentName(appointment.getAgent().getUser().getFullName())
                .agentSpecialization(appointment.getAgent().getSpecialization())
                .appointmentDateTime(appointment.getAppointmentDateTime())
                .status(appointment.getStatus())
                .type(appointment.getType())
                .notes(appointment.getNotes())
                .cancellationReason(appointment.getCancellationReason())
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}
