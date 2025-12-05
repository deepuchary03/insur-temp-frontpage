package com.insurance.controller;

import com.insurance.dto.AIQueryRequest;
import com.insurance.dto.AIQueryResponse;
import com.insurance.service.AIService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin
public class AIController {
    
    @Autowired
    private AIService aiService;
    
    @PostMapping("/query")
    public ResponseEntity<AIQueryResponse> processQuery(@Valid @RequestBody AIQueryRequest request) {
        return ResponseEntity.ok(aiService.processQuery(request));
    }
}
