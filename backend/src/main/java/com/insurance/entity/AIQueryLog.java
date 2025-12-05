package com.insurance.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_query_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIQueryLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(length = 2000, nullable = false)
    private String question;
    
    @Column(length = 5000)
    private String answer;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isVoiceQuery = false;
    
    @Column(length = 500)
    private String category; // Auto-categorized by AI
    
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    private Integer responseTime; // in milliseconds
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean wasHelpful = true;
}
