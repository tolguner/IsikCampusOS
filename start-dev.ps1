Write-Host "Starting IsikCampusOS Development Environment..." -ForegroundColor Green

. .\tools\load-env.ps1

Write-Host "1. Starting Infrastructure (Docker Compose)..." -ForegroundColor Yellow
docker compose -f infra/docker-compose.infra.yml up -d

Write-Host "2. Building Backend Services..." -ForegroundColor Yellow
.\mvnw.cmd clean compile -DskipTests

Write-Host "3. Starting Eureka Server..." -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList "/k", "title Eureka Server && .\mvnw.cmd spring-boot:run -pl services/eureka-server"

Write-Host "Waiting 10 seconds for Eureka to initialize..."
Start-Sleep -Seconds 10

Write-Host "4. Starting other Backend Services..." -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList "/k", "title API Gateway && .\mvnw.cmd spring-boot:run -pl services/api-gateway"
Start-Process "cmd.exe" -ArgumentList "/k", "title Auth Service && .\mvnw.cmd spring-boot:run -pl services/auth-service"
Start-Process "cmd.exe" -ArgumentList "/k", "title Profile Service && .\mvnw.cmd spring-boot:run -pl services/profile-service"
Start-Process "cmd.exe" -ArgumentList "/k", "title Event Service && .\mvnw.cmd spring-boot:run -pl services/event-service"

Write-Host "5. Starting Frontend Application..." -ForegroundColor Magenta
Start-Process "cmd.exe" -ArgumentList "/k", "title Frontend && npm run dev"

Write-Host "All services have been started in separate windows." -ForegroundColor Green
