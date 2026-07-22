# Setup de Vera (Windows / PowerShell)
Write-Host "Vera — setup" -ForegroundColor Cyan

npm install
npx playwright install chromium

if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host "Creado .env.local (edita EVOLUTION_API_KEY)" -ForegroundColor Yellow
}

docker compose up -d   # Evolution API (WhatsApp)

Write-Host ""
Write-Host "Listo. Pasos finales:" -ForegroundColor Green
Write-Host "  1. Edita .env.local (EVOLUTION_API_KEY = la misma de docker-compose)"
Write-Host "  2. Escanea el QR en http://localhost:8080/manager con tu WhatsApp dedicado"
Write-Host "  3. (Opcional) npm run seed   # leads de ejemplo"
Write-Host "  4. npm run dev   ->  http://localhost:3000"
