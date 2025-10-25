#!/bin/sh
set -e

echo "🚀 Starting Pro-Mata Backend..."

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

echo "📦 Database URL configured"

# Rodar migrations do Prisma
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy || {
  echo "⚠️  Migration failed, but continuing startup..."
  echo "   You may need to run migrations manually: docker exec <container> npx prisma migrate deploy"
}

echo "✅ Migrations completed (or skipped)"

# Iniciar aplicação
echo "🎯 Starting NestJS application..."
exec node dist/main.js
