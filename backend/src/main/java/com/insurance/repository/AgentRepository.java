package com.insurance.repository;

import com.insurance.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentRepository extends JpaRepository<Agent, Long> {
    
    Optional<Agent> findByUserId(Long userId);
    
    List<Agent> findByIsAvailableTrue();
    
    List<Agent> findBySpecialization(String specialization);
    
    @Query("SELECT a FROM Agent a WHERE a.isAvailable = true ORDER BY a.rating DESC")
    List<Agent> findTopAgentsByRating();
    
    @Query("SELECT a FROM Agent a ORDER BY a.rating DESC")
    List<Agent> findAllOrderByRatingDesc();
}
