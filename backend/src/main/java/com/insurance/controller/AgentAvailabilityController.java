package com.insurance.controller;

import com.insurance.dto.AvailabilityDTO;
import com.insurance.dto.AvailabilityRequest;
import com.insurance.service.AgentAvailabilityService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/availability")
@CrossOrigin
public class AgentAvailabilityController {
    
    @Autowired
    private AgentAvailabilityService availabilityService;
    
    @GetMapping("/agent/{agentId}")
    public ResponseEntity<List<AvailabilityDTO>> getAgentAvailability(@PathVariable Long agentId) {
        return ResponseEntity.ok(availabilityService.getAgentAvailability(agentId));
    }
    
    @GetMapping("/agent/{agentId}/available")
    public ResponseEntity<List<AvailabilityDTO>> getAvailableSlots(
            @PathVariable Long agentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate) {
        return ResponseEntity.ok(availabilityService.getAvailableSlots(agentId, fromDate));
    }
    
    @GetMapping("/agent/{agentId}/date/{date}")
    public ResponseEntity<List<AvailabilityDTO>> getAgentAvailabilityByDate(
            @PathVariable Long agentId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(availabilityService.getAgentAvailabilityByDate(agentId, date));
    }
    
    @GetMapping("/agent/{agentId}/range")
    public ResponseEntity<List<AvailabilityDTO>> getAgentAvailabilityByDateRange(
            @PathVariable Long agentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(availabilityService.getAgentAvailabilityByDateRange(agentId, startDate, endDate));
    }
    
    @PostMapping
    public ResponseEntity<AvailabilityDTO> createAvailability(@Valid @RequestBody AvailabilityRequest request) {
        return ResponseEntity.ok(availabilityService.createAvailability(request));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AvailabilityDTO> updateAvailability(
            @PathVariable Long id,
            @Valid @RequestBody AvailabilityRequest request) {
        return ResponseEntity.ok(availabilityService.updateAvailability(id, request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAvailability(@PathVariable Long id) {
        availabilityService.deleteAvailability(id);
        return ResponseEntity.noContent().build();
    }
}
