Write-Host "Starting IsikCampusOS Development Environment (Docker Mode)..." -ForegroundColor Green

. .\tools\load-env.ps1

Write-Host "1. Building Backend Services (creating JARs)..." -ForegroundColor Yellow
.\mvnw.cmd clean package -DskipTests

Write-Host "2. Stopping any previously running containers..." -ForegroundColor Cyan
docker compose -f infra/docker-compose.infra.yml down 2>$null
docker compose down 2>$null

Write-Host "3. Starting all services via Docker Compose..." -ForegroundColor Magenta
docker compose up -d

Write-Host "All services have been started!" -ForegroundColor Green
Write-Host "You can monitor the logs in Docker Desktop." -ForegroundColor Yellow
Write-Host "The application will be available at http://localhost:8080/ shortly." -ForegroundColor Green
