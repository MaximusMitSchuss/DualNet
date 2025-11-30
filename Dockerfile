# Stage 1: Build der Anwendung
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Nur das Nötigste kopieren, damit Docker-Caching gut funktioniert
COPY pom.xml .
COPY src ./src

# Projekt bauen (Tests können hier übersprungen werden, wenn es schneller sein soll)
RUN mvn -B clean package -DskipTests

# Stage 2: Runtime-Image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Gebautes JAR aus dem Build-Container holen
COPY --from=build /app/target/*.jar app.jar

# Spring Boot läuft standardmäßig auf Port 8080
EXPOSE 8080

# Startbefehl
ENTRYPOINT ["java", "-jar", "app.jar"]
