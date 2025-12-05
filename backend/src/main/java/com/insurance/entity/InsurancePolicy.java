package com.insurance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "insurance_policies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InsurancePolicy {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;
    
    @ManyToOne
    @JoinColumn(name = "agent_id")
    private Agent agent;
    
    @Column(nullable = false, unique = true)
    private String policyNumber;
    
    @Column(nullable = false)
    private String policyName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicyType type;
    
    @Column(nullable = false)
    private BigDecimal premium;
    
    @Column(nullable = false)
    private BigDecimal coverageAmount;
    
    @Column(nullable = false)
    private LocalDate startDate;
    
    @Column(nullable = false)
    private LocalDate endDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PolicyStatus status = PolicyStatus.ACTIVE;
    
    @Column(length = 2000)
    private String description;
    
    @Column(length = 1000)
    private String benefits;
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    public enum PolicyType {
        LIFE, HEALTH, AUTO, HOME, BUSINESS, TRAVEL, DISABILITY
    }
    
    public enum PolicyStatus {
        ACTIVE, INACTIVE, EXPIRED, CANCELLED, PENDING
    }
}
