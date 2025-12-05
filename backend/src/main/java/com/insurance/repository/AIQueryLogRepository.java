package com.insurance.repository;

import com.insurance.entity.AIQueryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIQueryLogRepository extends JpaRepository<AIQueryLog, Long> {
    
    List<AIQueryLog> findByUserId(Long userId);
    
    List<AIQueryLog> findByCategory(String category);
    
    @Query("SELECT a FROM AIQueryLog a ORDER BY a.createdAt DESC")
    List<AIQueryLog> findRecentQueries();
    
    @Query("SELECT a.category, COUNT(a) FROM AIQueryLog a WHERE a.category IS NOT NULL GROUP BY a.category")
    List<Object[]> countByCategory();
    
    @Query("SELECT AVG(a.responseTime) FROM AIQueryLog a WHERE a.responseTime IS NOT NULL")
    Double getAverageResponseTime();
}
