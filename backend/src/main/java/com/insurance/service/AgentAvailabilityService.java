package com.insurance.service;

import com.insurance.dto.AvailabilityDTO;
import com.insurance.dto.AvailabilityRequest;
import com.insurance.entity.Agent;
import com.insurance.entity.AgentAvailability;
import com.insurance.repository.AgentAvailabilityRepository;
import com.insurance.repository.AgentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AgentAvailabilityService {
    
    @Autowired
    private AgentAvailabilityRepository availabilityRepository;
    
    @Autowired
    private AgentRepository agentRepository;
    
    public List<AvailabilityDTO> getAgentAvailability(Long agentId) {
        return availabilityRepository.findByAgentId(agentId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<AvailabilityDTO> getAvailableSlots(Long agentId, LocalDate fromDate) {
        return availabilityRepository.findAvailableSlots(agentId, fromDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<AvailabilityDTO> getAgentAvailabilityByDate(Long agentId, LocalDate date) {
        return availabilityRepository.findByAgentIdAndDate(agentId, date).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<AvailabilityDTO> getAgentAvailabilityByDateRange(Long agentId, LocalDate startDate, LocalDate endDate) {
        return availabilityRepository.findByAgentIdAndDateRange(agentId, startDate, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public AvailabilityDTO createAvailability(AvailabilityRequest request) {
        Agent agent = agentRepository.findById(request.getAgentId())
                .orElseThrow(() -> new RuntimeException("Agent not found"));
        
        AgentAvailability availability = AgentAvailability.builder()
                .agent(agent)
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isBooked(false)
                .build();
        
        availability = availabilityRepository.save(availability);
        return convertToDTO(availability);
    }
    
    @Transactional
    public AvailabilityDTO updateAvailability(Long id, AvailabilityRequest request) {
        AgentAvailability availability = availabilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Availability not found"));
        
        availability.setDate(request.getDate());
        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());
        
        availability = availabilityRepository.save(availability);
        return convertToDTO(availability);
    }
    
    @Transactional
    public void deleteAvailability(Long id) {
        AgentAvailability availability = availabilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Availability not found"));
        
        if (availability.getIsBooked()) {
            throw new RuntimeException("Cannot delete booked availability slot");
        }
        
        availabilityRepository.deleteById(id);
    }
    
    @Transactional
    public void markAsBooked(Long id) {
        AgentAvailability availability = availabilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Availability not found"));
        availability.setIsBooked(true);
        availabilityRepository.save(availability);
    }
    
    @Transactional
    public void markAsAvailable(Long id) {
        AgentAvailability availability = availabilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Availability not found"));
        availability.setIsBooked(false);
        availabilityRepository.save(availability);
    }
    
    private AvailabilityDTO convertToDTO(AgentAvailability availability) {
        return AvailabilityDTO.builder()
                .id(availability.getId())
                .agentId(availability.getAgent().getId())
                .agentName(availability.getAgent().getUser().getFullName())
                .date(availability.getDate())
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .isBooked(availability.getIsBooked())
                .build();
    }
}
