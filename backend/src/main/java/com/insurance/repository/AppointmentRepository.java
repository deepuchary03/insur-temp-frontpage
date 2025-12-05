package com.insurance.repository;

import com.insurance.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    List<Appointment> findByCustomerId(Long customerId);
    
    List<Appointment> findByAgentId(Long agentId);
    
    List<Appointment> findByStatus(Appointment.AppointmentStatus status);
    
    List<Appointment> findByCustomerIdOrderByAppointmentDateTimeDesc(Long customerId);
    
    List<Appointment> findByAgentIdOrderByAppointmentDateTimeDesc(Long agentId);
    
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDateTime >= :startDate AND a.appointmentDateTime <= :endDate")
    List<Appointment> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.status = :status")
    Long countByStatus(@Param("status") Appointment.AppointmentStatus status);
    
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.type = :type")
    Long countByType(@Param("type") Appointment.AppointmentType type);
    
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.agent.id = :agentId")
    Long countByAgentId(@Param("agentId") Long agentId);
    
    @Query("SELECT a FROM Appointment a ORDER BY a.createdAt DESC")
    List<Appointment> findRecentAppointments();
}
