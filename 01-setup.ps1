$ErrorActionPreference = "Stop"

Write-Host "ReachInbox Scheduler - initial setup" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed. Install Node.js 22 or newer."
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker Desktop is not installed or is not running."
}

if (-not (Test-Path "backend/.env")) {
  Copy-Item "backend/.env.example" "backend/.env"
  Write-Host "Created backend/.env" -ForegroundColor Green
}

if (-not (Test-Path "frontend/.env")) {
  Copy-Item "frontend/.env.example" "frontend/.env"
  Write-Host "Created frontend/.env" -ForegroundColor Green
}

Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Cyan
docker compose up -d postgres redis

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "\nNext actions:" -ForegroundColor Yellow
Write-Host "1. Create Google OAuth Web Client ID and update backend/.env + frontend/.env"
Write-Host "2. Run 'npm run ethereal:create' twice and update ETHEREAL_ACCOUNTS_JSON"
Write-Host "3. Replace JWT_SECRET with a secure random value"
Write-Host "4. Run .\\02-run.ps1"
