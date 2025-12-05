package com.insurance.service;

import com.insurance.dto.AIQueryRequest;
import com.insurance.dto.AIQueryResponse;
import com.insurance.entity.AIQueryLog;
import com.insurance.entity.Agent;
import com.insurance.entity.User;
import com.insurance.repository.AIQueryLogRepository;
import com.insurance.repository.AgentRepository;
import com.insurance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class AIService {
    
    @Autowired
    private AIQueryLogRepository queryLogRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AgentRepository agentRepository;
    
    @Value("${gemini.api.key}")
    private String geminiApiKey;
    
    @Value("${gemini.api.url}")
    private String geminiApiUrl;
    
    private final WebClient webClient;
    
    public AIService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }
    
    @Transactional
    public AIQueryResponse processQuery(AIQueryRequest request) {
        Instant startTime = Instant.now();
        
        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId()).orElse(null);
        }
        
        // Enhanced prompt for insurance context
        String enhancedPrompt = buildInsurancePrompt(request.getQuestion());
        System.out.println("=== Enhanced Prompt ===");
        System.out.println(enhancedPrompt.substring(0, Math.min(enhancedPrompt.length(), 300)) + "...");
        
        try {
            // Call Gemini API
            String answer = callGeminiAPI(enhancedPrompt);
            
            // Extract category and action suggestion
            String category = categorizeQuery(request.getQuestion());
            boolean canBookAppointment = detectAppointmentIntent(request.getQuestion());
            String suggestedAction = canBookAppointment ? "Schedule an appointment with our agent" : null;
            
            int responseTime = (int) Duration.between(startTime, Instant.now()).toMillis();
            
            // Log the query
            AIQueryLog log = AIQueryLog.builder()
                    .user(user)
                    .question(request.getQuestion())
                    .answer(answer)
                    .isVoiceQuery(request.getIsVoiceQuery())
                    .category(category)
                    .responseTime(responseTime)
                    .wasHelpful(true)
                    .build();
            
            queryLogRepository.save(log);
            
            return AIQueryResponse.builder()
                    .answer(answer)
                    .category(category)
                    .responseTime(responseTime)
                    .canBookAppointment(canBookAppointment)
                    .suggestedAction(suggestedAction)
                    .build();
                    
        } catch (Exception e) {
            return AIQueryResponse.builder()
                    .answer("I apologize, but I'm having trouble processing your request right now. Please try again or contact our support team.")
                    .category("ERROR")
                    .responseTime((int) Duration.between(startTime, Instant.now()).toMillis())
                    .canBookAppointment(false)
                    .build();
        }
    }
    
    private String callGeminiAPI(String prompt) {
        try {
            // Log API configuration for debugging
            System.out.println("=== Gemini API Debug Info ===");
            System.out.println("API URL: " + geminiApiUrl);
            System.out.println("API Key present: " + (geminiApiKey != null && !geminiApiKey.isEmpty()));
            System.out.println("API Key length: " + (geminiApiKey != null ? geminiApiKey.length() : 0));
            System.out.println("API Key starts with: " + (geminiApiKey != null && geminiApiKey.length() > 10 ? geminiApiKey.substring(0, 10) + "..." : "N/A"));
            
            Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                    Map.of(
                        "parts", new Object[]{
                            Map.of("text", prompt)
                        }
                    )
                }
            );
            
            String fullUrl = geminiApiUrl + "?key=" + geminiApiKey;
            System.out.println("Full URL: " + fullUrl.substring(0, Math.min(fullUrl.length(), 100)) + "...");
            
            String response = webClient.post()
                    .uri(fullUrl)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            System.out.println("Response received: " + (response != null ? response.substring(0, Math.min(response.length(), 200)) : "NULL"));
            
            // Parse the response - this is simplified
            // In production, use proper JSON parsing
            return extractTextFromGeminiResponse(response);
            
        } catch (Exception e) {
            System.err.println("=== Gemini API Error ===");
            System.err.println("Error type: " + e.getClass().getName());
            System.err.println("Error message: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to call Gemini API: " + e.getMessage(), e);
        }
    }
    
    private String extractTextFromGeminiResponse(String response) {
        try {
            // Find the text content within the response
            int textStart = response.indexOf("\"text\":");
            if (textStart != -1) {
                // Find the start of the actual text content
                int contentStart = response.indexOf("\"", textStart + 8);
                
                // Find the end by looking for the closing quote, handling escaped quotes
                int contentEnd = contentStart + 1;
                while (contentEnd < response.length()) {
                    if (response.charAt(contentEnd) == '"' && response.charAt(contentEnd - 1) != '\\') {
                        break;
                    }
                    contentEnd++;
                }
                
                if (contentEnd < response.length()) {
                    String text = response.substring(contentStart + 1, contentEnd);
                    // Unescape common escape sequences
                    return text.replace("\\n", "\n")
                               .replace("\\\"", "\"")
                               .replace("\\r", "\r")
                               .replace("\\t", "\t")
                               .replace("\\\\", "\\");
                }
            }
        } catch (Exception e) {
            System.err.println("Error extracting text from Gemini response: " + e.getMessage());
        }
        return "I'm here to help you with insurance-related questions. Could you please rephrase your query?";
    }
    
    private String buildInsurancePrompt(String question) {
        // Get real-time data from database
        List<Agent> agents = agentRepository.findAll();
        int totalAgents = agents.size();
        long availableAgents = agents.stream().filter(Agent::getIsAvailable).count();
        
        StringBuilder agentInfo = new StringBuilder();
        agentInfo.append("\n\nCurrent Agent Information:");
        agentInfo.append("\n- Total Agents: ").append(totalAgents);
        agentInfo.append("\n- Available Agents: ").append(availableAgents);
        
        if (!agents.isEmpty()) {
            agentInfo.append("\n\nOur Agents:");
            agents.stream().limit(5).forEach(agent -> {
                agentInfo.append("\n  • ").append(agent.getUser().getFullName())
                         .append(" - ").append(agent.getSpecialization())
                         .append(" (").append(agent.getIsAvailable() ? "Available" : "Busy").append(")")
                         .append(" - ").append(agent.getExperienceYears()).append(" years experience");
            });
        }
        
        return "You are an AI assistant for an online corporate insurance system. " +
               "Your role is to help customers understand insurance products, policies, claims, and appointments. " +
               "Be professional, friendly, and concise. Use the REAL data provided below." +
               "\n\nInsurance types we offer:" +
               "\n- Life Insurance: Term life, whole life, universal life policies" +
               "\n- Health Insurance: Individual, family, and corporate health plans" +
               "\n- Auto Insurance: Comprehensive and collision coverage for vehicles" +
               "\n- Home Insurance: Property, contents, and liability coverage" +
               "\n- Business Insurance: Commercial property, liability, and workers comp" +
               agentInfo.toString() +
               "\n\nOur specialized agents are available to help with:" +
               "\n- Personalized policy recommendations" +
               "\n- Claims assistance and guidance" +
               "\n- Policy reviews and renewals" +
               "\n- Coverage analysis and optimization" +
               "\n\nWhen asked about agents, use the REAL agent data provided above. " +
               "If the question is about booking an appointment or speaking with an agent, " +
               "enthusiastically encourage them to connect with one of our expert insurance specialists. " +
               "Tell them they can say 'show available agents' or 'book an appointment' to see available agents " +
               "and schedule a consultation immediately." +
               "\n\nQuestion: " + question + 
               "\n\nProvide a clear, helpful answer in 2-4 sentences using the REAL data above. Be conversational, warm, and natural.";
    }
    
    private String categorizeQuery(String question) {
        String lowerQuestion = question.toLowerCase();
        
        if (lowerQuestion.contains("life insurance") || lowerQuestion.contains("term insurance")) {
            return "LIFE_INSURANCE";
        } else if (lowerQuestion.contains("health") || lowerQuestion.contains("medical")) {
            return "HEALTH_INSURANCE";
        } else if (lowerQuestion.contains("auto") || lowerQuestion.contains("car") || lowerQuestion.contains("vehicle")) {
            return "AUTO_INSURANCE";
        } else if (lowerQuestion.contains("home") || lowerQuestion.contains("property")) {
            return "HOME_INSURANCE";
        } else if (lowerQuestion.contains("claim")) {
            return "CLAIMS";
        } else if (lowerQuestion.contains("appointment") || lowerQuestion.contains("schedule") || lowerQuestion.contains("meeting")) {
            return "APPOINTMENT";
        } else if (lowerQuestion.contains("policy") || lowerQuestion.contains("coverage")) {
            return "POLICY_INQUIRY";
        } else if (lowerQuestion.contains("premium") || lowerQuestion.contains("price") || lowerQuestion.contains("cost")) {
            return "PRICING";
        } else {
            return "GENERAL";
        }
    }
    
    private boolean detectAppointmentIntent(String question) {
        String lowerQuestion = question.toLowerCase();
        return lowerQuestion.contains("appointment") || 
               lowerQuestion.contains("schedule") || 
               lowerQuestion.contains("book") ||
               lowerQuestion.contains("meet") || 
               lowerQuestion.contains("talk to") ||
               lowerQuestion.contains("speak to") ||
               lowerQuestion.contains("agent") ||
               lowerQuestion.contains("consultation") ||
               lowerQuestion.contains("discuss") ||
               lowerQuestion.contains("call me") ||
               lowerQuestion.contains("contact");
    }
}
