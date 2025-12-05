package com.insurance.repository;

import com.insurance.entity.InsurancePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InsurancePolicyRepository extends JpaRepository<InsurancePolicy, Long> {
    
    List<InsurancePolicy> findByCustomerId(Long customerId);
    
    List<InsurancePolicy> findByAgentId(Long agentId);
    
    Optional<InsurancePolicy> findByPolicyNumber(String policyNumber);
    
    List<InsurancePolicy> findByStatus(InsurancePolicy.PolicyStatus status);
    
    List<InsurancePolicy> findByType(InsurancePolicy.PolicyType type);
}
