package com.insurance.controller;

import com.insurance.dto.AgentDTO;
import com.insurance.service.AgentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/agents")
@CrossOrigin
public class AgentController {
    
    @Autowired
    private AgentService agentService;
    
    @GetMapping
    public ResponseEntity<List<AgentDTO>> getAllAgents() {
        return ResponseEntity.ok(agentService.getAllAgents());
    }
    
    @GetMapping("/available")
    public ResponseEntity<List<AgentDTO>> getAvailableAgents() {
        return ResponseEntity.ok(agentService.getAvailableAgents());
    }
    
    @GetMapping("/top")
    public ResponseEntity<List<AgentDTO>> getTopAgents() {
        return ResponseEntity.ok(agentService.getTopAgents());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AgentDTO> getAgentById(@PathVariable Long id) {
        return ResponseEntity.ok(agentService.getAgentById(id));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<AgentDTO> getAgentByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(agentService.getAgentByUserId(userId));
    }
    
    @GetMapping("/specialization/{specialization}")
    public ResponseEntity<List<AgentDTO>> getAgentsBySpecialization(@PathVariable String specialization) {
        return ResponseEntity.ok(agentService.getAgentsBySpecialization(specialization));
    }
    
    @PostMapping
    public ResponseEntity<AgentDTO> createAgent(@RequestBody AgentDTO agentDTO) {
        return ResponseEntity.ok(agentService.createAgent(agentDTO));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AgentDTO> updateAgent(@PathVariable Long id, @RequestBody AgentDTO agentDTO) {
        return ResponseEntity.ok(agentService.updateAgent(id, agentDTO));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAgent(@PathVariable Long id) {
        agentService.deleteAgent(id);
        return ResponseEntity.noContent().build();
    }
}
