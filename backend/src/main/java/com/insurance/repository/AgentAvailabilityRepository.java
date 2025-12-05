package com.insurance.repository;

import com.insurance.entity.AgentAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AgentAvailabilityRepository extends JpaRepository<AgentAvailability, Long> {
    
    List<AgentAvailability> findByAgentId(Long agentId);
    
    List<AgentAvailability> findByAgentIdAndDate(Long agentId, LocalDate date);
    
    List<AgentAvailability> findByAgentIdAndIsBookedFalse(Long agentId);
    
    @Query("SELECT a FROM AgentAvailability a WHERE a.agent.id = :agentId AND a.date >= :startDate AND a.date <= :endDate")
    List<AgentAvailability> findByAgentIdAndDateRange(
        @Param("agentId") Long agentId, 
        @Param("startDate") LocalDate startDate, 
        @Param("endDate") LocalDate endDate
    );
    
    @Query("SELECT a FROM AgentAvailability a WHERE a.agent.id = :agentId AND a.date >= :date AND a.isBooked = false ORDER BY a.date, a.startTime")
    List<AgentAvailability> findAvailableSlots(@Param("agentId") Long agentId, @Param("date") LocalDate date);
}
