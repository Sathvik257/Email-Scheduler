$ErrorActionPreference = "Stop"

function Assert-NoPlaceholder($Path) {
  if (-not (Test-Path $Path)) {
    throw "$Path is missing. Run .\\01-setup.ps1 first."
  }
  $content = Get-Content $Path -Raw
  if ($content -match "replace-with|your-google|\\\"user\\\":\\\"replace\\\"") {
    throw "$Path still contains placeholder credentials. Complete the environment setup first."
  }
}

Assert-NoPlaceholder "backend/.env"
Assert-NoPlaceholder "frontend/.env"

Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Cyan
docker compose up -d postgres redis

Write-Host "Generating Prisma client..." -ForegroundColor Cyan
npm run db:generate --workspace backend

Write-Host "Applying database migration..." -ForegroundColor Cyan
npm run db:migrate

Write-Host "Starting API, worker, and frontend..." -ForegroundColor Green
npm run dev
