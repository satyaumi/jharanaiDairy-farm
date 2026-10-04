# ==========================================
# Stage 1: Build Application with Maven
# ==========================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /workspace

# Copy POM and download dependencies for layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and compile production JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# Stage 2: Production JRE Runtime
# ==========================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Security: Create and use non-root application user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled jar from build stage
COPY --from=builder /workspace/target/app.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser

# Render dynamically sets $PORT environment variable at runtime
ENV PORT=8085
EXPOSE 8085

# Spring Boot dynamic port binding & container-aware memory configuration for 512MB environments
ENTRYPOINT ["sh", "-c", "exec java -XX:+UseSerialGC -Xms128m -Xmx300m -XX:MaxMetaspaceSize=128m -XX:CompressedClassSpaceSize=32m -Xss512k -Djava.security.egd=file:/dev/./urandom -Dserver.port=${PORT:-8085} -Dserver.address=0.0.0.0 -jar app.jar"]
