$ErrorActionPreference = "Stop"

Write-Host "This removes demo email records and BullMQ jobs but keeps Docker volumes." -ForegroundColor Yellow
$answer = Read-Host "Type RESET to continue"
if ($answer -ne "RESET") {
  Write-Host "Cancelled."
  exit 0
}

# Reset DB schema in development and clear Redis queue data.
docker compose exec -T redis redis-cli FLUSHDB | Out-Host
npm exec --workspace backend prisma migrate reset -- --force
Write-Host "Demo data reset. Run .\\02-run.ps1." -ForegroundColor Green
