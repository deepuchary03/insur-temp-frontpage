package com.insurance.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Loads environment variables from .env file before Spring Boot starts
 * This allows us to use .env file for local development
 */
public class DotenvConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        try {
            // Load .env file
            Dotenv dotenv = Dotenv.configure()
                    .directory(".")  // Look in current directory
                    .ignoreIfMissing()  // Don't fail if .env doesn't exist
                    .load();

            // Convert to Map
            Map<String, Object> envMap = new HashMap<>();
            dotenv.entries().forEach(entry -> {
                envMap.put(entry.getKey(), entry.getValue());
                // Also set as system property for fallback
                System.setProperty(entry.getKey(), entry.getValue());
            });

            // Add to Spring Environment
            ConfigurableEnvironment environment = applicationContext.getEnvironment();
            environment.getPropertySources().addFirst(
                new MapPropertySource("dotenvProperties", envMap)
            );

            System.out.println("✅ Loaded environment variables from .env file");
        } catch (Exception e) {
            System.out.println("⚠️ No .env file found, using default values from application.properties");
        }
    }
}
