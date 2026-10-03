package com.dairyfarm.app.common.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Production-ready DataSource configuration.
 *
 * Automatically parses Render PostgreSQL connection URLs (which typically follow
 * the format postgres://[user]:[password]@[host]:[port]/[database]) into standard
 * JDBC-compatible PostgreSQL URLs with SSL support.
 *
 * Deactivated in the 'test' profile to allow seamless H2 test execution.
 */
@Slf4j
@Configuration
@Profile("!test")
public class DatabaseConfig {

    @Value("${DATABASE_URL:#{null}}")
    private String databaseUrl;

    @Value("${spring.datasource.url:#{null}}")
    private String springDatasourceUrl;

    @Value("${spring.datasource.username:#{null}}")
    private String springDatasourceUsername;

    @Value("${spring.datasource.password:#{null}}")
    private String springDatasourcePassword;

    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setDriverClassName(driverClassName);
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(3);
        config.setIdleTimeout(300000);
        config.setConnectionTimeout(20000);

        String rawUrl = (databaseUrl != null && !databaseUrl.isBlank())
                ? databaseUrl.trim()
                : (springDatasourceUrl != null ? springDatasourceUrl.trim() : null);

        if (rawUrl != null && (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))) {
            log.info("Detected cloud PostgreSQL URI. Converting to JDBC format for HikariCP...");
            try {
                // Normalize scheme for URI parsing if needed
                String cleanUrl = rawUrl.replace("jdbc:", "");
                URI uri = new URI(cleanUrl);

                String userInfo = uri.getUserInfo();
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath(); // e.g. "/databasename"

                if (userInfo != null && userInfo.contains(":")) {
                    String[] credentials = userInfo.split(":", 2);
                    config.setUsername(credentials[0]);
                    config.setPassword(credentials[1]);
                } else if (userInfo != null) {
                    config.setUsername(userInfo);
                    if (springDatasourcePassword != null) {
                        config.setPassword(springDatasourcePassword);
                    }
                }

                // Construct JDBC URL
                StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append(path != null ? path : "");

                String query = uri.getQuery();
                if (query != null && !query.isBlank()) {
                    jdbcUrl.append("?").append(query);
                } else if (!"localhost".equalsIgnoreCase(host) && !"127.0.0.1".equals(host)) {
                    // Render PostgreSQL external connection requires sslmode=require
                    jdbcUrl.append("?sslmode=require");
                }

                config.setJdbcUrl(jdbcUrl.toString());
                log.info("Successfully configured JDBC connection for host: {}:{}", host, port);
            } catch (URISyntaxException e) {
                log.error("Failed to parse PostgreSQL URI syntax: {}. Falling back to raw URL.", e.getMessage());
                config.setJdbcUrl(rawUrl);
                if (springDatasourceUsername != null) config.setUsername(springDatasourceUsername);
                if (springDatasourcePassword != null) config.setPassword(springDatasourcePassword);
            }
        } else if (rawUrl != null) {
            config.setJdbcUrl(rawUrl);
            if (springDatasourceUsername != null) config.setUsername(springDatasourceUsername);
            if (springDatasourcePassword != null) config.setPassword(springDatasourcePassword);
        } else {
            // Default local fallback
            config.setJdbcUrl("jdbc:postgresql://localhost:5432/Dairy-farm");
            config.setUsername(springDatasourceUsername != null ? springDatasourceUsername : "postgres");
            config.setPassword(springDatasourcePassword != null ? springDatasourcePassword : "postgres");
        }

        return new HikariDataSource(config);
    }
}
