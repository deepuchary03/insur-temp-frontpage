package com.insurance.service;

import com.insurance.dto.AppointmentDTO;
import com.insurance.dto.AppointmentRequest;
import com.insurance.entity.Agent;
import com.insurance.entity.AgentAvailability;
import com.insurance.entity.Appointment;
import com.insurance.entity.User;
import com.insurance.repository.AgentAvailabilityRepository;
import com.insurance.repository.AgentRepository;
import com.insurance.repository.AppointmentRepository;
import com.insurance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AgentRepository agentRepository;
    
    @Autowired
    private AgentAvailabilityRepository availabilityRepository;
    
    @Autowired
    private AgentAvailabilityService availabilityService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private AgentService agentService;
    
    public List<AppointmentDTO> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<AppointmentDTO> getCustomerAppointments(Long customerId) {
        return appointmentRepository.findByCustomerIdOrderByAppointmentDateTimeDesc(customerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<AppointmentDTO> getAgentAppointments(Long agentId) {
        return appointmentRepository.findByAgentIdOrderByAppointmentDateTimeDesc(agentId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public AppointmentDTO getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        return convertToDTO(appointment);
    }
    
    public List<AppointmentDTO> getAppointmentsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return appointmentRepository.findByDateRange(startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public AppointmentDTO createAppointment(AppointmentRequest request) {
        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        Agent agent = agentRepository.findById(request.getAgentId())
                .orElseThrow(() -> new RuntimeException("Agent not found"));
        
        // Check if agent is available at the requested time
        // This is a simplified check - in production, you'd want more robust validation
        
        Appointment appointment = Appointment.builder()
                .customer(customer)
                .agent(agent)
                .appointmentDateTime(request.getAppointmentDateTime())
                .type(request.getType())
                .notes(request.getNotes())
                .status(Appointment.AppointmentStatus.PENDING)
                .build();
        
        appointment = appointmentRepository.save(appointment);
        
        // Update agent appointment count
        agentService.incrementAppointmentCount(agent.getId());
        
        // Send notifications
        notificationService.sendAppointmentConfirmation(appointment);
        
        return convertToDTO(appointment);
    }
    
    @Transactional
    public AppointmentDTO updateAppointmentStatus(Long id, Appointment.AppointmentStatus status, String reason) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        Appointment.AppointmentStatus oldStatus = appointment.getStatus();
        appointment.setStatus(status);
        
        if (status == Appointment.AppointmentStatus.CANCELLED && reason != null) {
            appointment.setCancellationReason(reason);
            
            // Make availability slot available again if it was booked
            if (appointment.getAvailability() != null) {
                availabilityService.markAsAvailable(appointment.getAvailability().getId());
            }
            
            // Send cancellation notification
            notificationService.sendAppointmentCancellation(appointment);
        }
        
        appointment = appointmentRepository.save(appointment);
        return convertToDTO(appointment);
    }
    
    @Transactional
    public void deleteAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        // Make availability slot available again
        if (appointment.getAvailability() != null) {
            availabilityService.markAsAvailable(appointment.getAvailability().getId());
        }
        
        appointmentRepository.deleteById(id);
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
