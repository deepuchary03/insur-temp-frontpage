package com.insurance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;
    
    @ManyToOne
    @JoinColumn(name = "agent_id", nullable = false)
    private Agent agent;
    
    @ManyToOne
    @JoinColumn(name = "availability_id")
    private AgentAvailability availability;
    
    @Column(nullable = false)
    private LocalDateTime appointmentDateTime;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentType type; // CONSULTATION, CLAIM, POLICY_REVIEW, etc.
    
    @Column(length = 1000)
    private String notes;
    
    @Column(length = 1000)
    private String cancellationReason;
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    public enum AppointmentStatus {
        PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
    }
    
    public enum AppointmentType {
        CONSULTATION, CLAIM_ASSISTANCE, POLICY_REVIEW, NEW_POLICY, RENEWAL, OTHER
    }
}
