Write-Host "Stopping any running java/node processes..." -ForegroundColor Green
Stop-Process -Name "java", "node" -Force -ErrorAction SilentlyContinue

Write-Host "Creating logs directory if not exists..."
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

Write-Host "1. Starting Eureka Server..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-Command", ".\mvnw.cmd spring-boot:run -pl services/eureka-server > logs/eureka-server.live.log 2> logs/eureka-server.live.err.log"

Write-Host "Waiting 15 seconds for Eureka Server to fully initialize..."
Start-Sleep -Seconds 15

Write-Host "2. Starting Backend Services..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-Command", ".\mvnw.cmd spring-boot:run -pl services/api-gateway > logs/api-gateway.live.log 2> logs/api-gateway.live.err.log"
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-Command", ".\mvnw.cmd spring-boot:run -pl services/auth-service > logs/auth-service.live.log 2> logs/auth-service.live.err.log"
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-Command", ".\mvnw.cmd spring-boot:run -pl services/profile-service > logs/profile-service.live.log 2> logs/profile-service.live.err.log"
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-Command", ".\mvnw.cmd spring-boot:run -pl services/club-service > logs/club-service.live.log 2> logs/club-service.live.err.log"
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-Command", ".\mvnw.cmd spring-boot:run -pl services/facility-service > logs/facility-service.live.log 2> logs/facility-service.live.err.log"

Write-Host "Waiting 15 seconds for Backend Services to compile and start..."
Start-Sleep -Seconds 15

Write-Host "3. Starting Frontend Application..." -ForegroundColor Magenta
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-Command", "cd frontend; npm run dev > ../logs/frontend.live.log 2> ../logs/frontend.live.err.log"

Write-Host "Headless services have been started." -ForegroundColor Green
