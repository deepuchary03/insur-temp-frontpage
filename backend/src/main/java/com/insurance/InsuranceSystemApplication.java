package com.insurance;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class InsuranceSystemApplication {

    public static void main(String[] args) {
        // Load .env file before starting Spring Boot
        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory(".")
                    .ignoreIfMissing()
                    .load();
            
            // Set environment variables as system properties
            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });
            
            System.out.println("✅ Environment variables loaded from .env file");
        } catch (Exception e) {
            System.out.println("⚠️ No .env file found, using application.properties defaults");
        }
        
        SpringApplication.run(InsuranceSystemApplication.class, args);
        System.out.println("🚀 Online Corporate Insurance System Started Successfully!");
        System.out.println("📊 Access API at: http://localhost:8081");
        System.out.println("📚 API Documentation: http://localhost:8081/api/v1/health");
    }
}
