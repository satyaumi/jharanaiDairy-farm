package com.dairyfarm.app.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

@Slf4j
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:8081,http://localhost:3000}")
    private String allowedOrigins;

    @Value("${FRONTEND_URL:#{null}}")
    private String frontendUrl;

    @Value("${CORS_ORIGINS:#{null}}")
    private String corsOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        Set<String> originSet = new LinkedHashSet<>();

        // Add standard configured origins
        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            Arrays.stream(allowedOrigins.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(originSet::add);
        }

        // Add FRONTEND_URL if provided (e.g. Render env var pointing to Vercel domain)
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            Arrays.stream(frontendUrl.split(","))
                    .map(String::trim)
                    .map(u -> u.replaceAll("/+$", ""))
                    .filter(s -> !s.isEmpty())
                    .forEach(originSet::add);
        }

        // Add CORS_ORIGINS if provided
        if (corsOrigins != null && !corsOrigins.isBlank()) {
            Arrays.stream(corsOrigins.split(","))
                    .map(String::trim)
                    .map(u -> u.replaceAll("/+$", ""))
                    .filter(s -> !s.isEmpty())
                    .forEach(originSet::add);
        }

        String[] origins = originSet.toArray(new String[0]);
        log.info("Configured CORS Allowed Origins: {}", Arrays.toString(origins));

        registry.addMapping("/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Content-Disposition", "X-Error-Message", "Authorization")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
