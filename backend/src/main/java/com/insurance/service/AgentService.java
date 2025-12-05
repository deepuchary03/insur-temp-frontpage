package com.insurance.service;

import com.insurance.dto.AgentDTO;
import com.insurance.entity.Agent;
import com.insurance.entity.User;
import com.insurance.repository.AgentRepository;
import com.insurance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AgentService {
    
    @Autowired
    private AgentRepository agentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public List<AgentDTO> getAllAgents() {
        return agentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<AgentDTO> getAvailableAgents() {
        return agentRepository.findByIsAvailableTrue().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<AgentDTO> getTopAgents() {
        return agentRepository.findTopAgentsByRating().stream()
                .limit(10)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public AgentDTO getAgentById(Long id) {
        Agent agent = agentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent not found"));
        return convertToDTO(agent);
    }
    
    public AgentDTO getAgentByUserId(Long userId) {
        Agent agent = agentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Agent not found for user"));
        return convertToDTO(agent);
    }
    
    public List<AgentDTO> getAgentsBySpecialization(String specialization) {
        return agentRepository.findBySpecialization(specialization).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public AgentDTO createAgent(AgentDTO agentDTO) {
        User user = userRepository.findById(agentDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if agent profile already exists
        if (agentRepository.findByUserId(user.getId()).isPresent()) {
            throw new RuntimeException("Agent profile already exists for this user");
        }
        
        Agent agent = Agent.builder()
                .user(user)
                .specialization(agentDTO.getSpecialization())
                .bio(agentDTO.getBio())
                .profileImage(agentDTO.getProfileImage())
                .experienceYears(agentDTO.getExperienceYears() != null ? agentDTO.getExperienceYears() : 0)
                .rating(0.0)
                .totalAppointments(0)
                .isAvailable(true)
                .build();
        
        agent = agentRepository.save(agent);
        return convertToDTO(agent);
    }
    
    @Transactional
    public AgentDTO updateAgent(Long id, AgentDTO agentDTO) {
        Agent agent = agentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent not found"));
        
        if (agentDTO.getSpecialization() != null) {
            agent.setSpecialization(agentDTO.getSpecialization());
        }
        if (agentDTO.getBio() != null) {
            agent.setBio(agentDTO.getBio());
        }
        if (agentDTO.getProfileImage() != null) {
            agent.setProfileImage(agentDTO.getProfileImage());
        }
        if (agentDTO.getExperienceYears() != null) {
            agent.setExperienceYears(agentDTO.getExperienceYears());
        }
        if (agentDTO.getIsAvailable() != null) {
            agent.setIsAvailable(agentDTO.getIsAvailable());
        }
        
        agent = agentRepository.save(agent);
        return convertToDTO(agent);
    }
    
    @Transactional
    public void deleteAgent(Long id) {
        agentRepository.deleteById(id);
    }
    
    @Transactional
    public void updateAgentRating(Long agentId, Double rating) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));
        agent.setRating(rating);
        agentRepository.save(agent);
    }
    
    @Transactional
    public void incrementAppointmentCount(Long agentId) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));
        agent.setTotalAppointments(agent.getTotalAppointments() + 1);
        agentRepository.save(agent);
    }
    
    private AgentDTO convertToDTO(Agent agent) {
        return AgentDTO.builder()
                .id(agent.getId())
                .userId(agent.getUser().getId())
                .fullName(agent.getUser().getFullName())
                .email(agent.getUser().getEmail())
                .phoneNumber(agent.getUser().getPhoneNumber())
                .specialization(agent.getSpecialization())
                .bio(agent.getBio())
                .profileImage(agent.getProfileImage())
                .experienceYears(agent.getExperienceYears())
                .rating(agent.getRating())
                .totalAppointments(agent.getTotalAppointments())
                .isAvailable(agent.getIsAvailable())
                .build();
    }
}
