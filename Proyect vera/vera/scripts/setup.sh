#!/bin/bash
# Setup de Vera (macOS / Linux / Git Bash)
echo "🚀 Vera — setup"
npm install
npx playwright install chromium

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "📝 Creado .env.local (edita EVOLUTION_API_KEY)"
fi

docker compose up -d   # Evolution API (WhatsApp)

echo ""
echo "✅ Listo. Pasos finales:"
echo "  1. Edita .env.local (EVOLUTION_API_KEY = la misma de docker-compose)"
echo "  2. Escanea el QR en http://localhost:8080/manager con tu WhatsApp dedicado"
echo "  3. (Opcional) npm run seed   # leads de ejemplo"
echo "  4. npm run dev   ->  http://localhost:3000"
