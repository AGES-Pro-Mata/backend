#!/bin/sh
set -e

echo "🚀 Starting Pro-Mata Backend (DEV)..."

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set!"
  exit 1
fi

echo "📦 Database URL configured"

# Regenerar Prisma Client (caso schema tenha mudado)
echo "🔄 Generating Prisma Client..."
npx prisma generate

# Rodar migrations (cria schema se não existir)
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy || {
  echo "⚠️  Migration failed, trying dev migration..."
  npx prisma migrate dev --skip-seed || echo "Migration failed, continuing..."
}

# Verificar se database está vazio (primeira vez)
echo "🔍 Checking if database needs seeding..."
DB_CHECK=$(npx prisma db execute --stdin <<EOF
SELECT COUNT(*) as count FROM "User";
EOF
2>/dev/null || echo "0")

if echo "$DB_CHECK" | grep -q "│ 0" || [ -z "$DB_CHECK" ]; then
  echo "📊 Database is empty, running seed..."
  npm run seed || echo "⚠️  Seed failed, continuing..."
else
  echo "✅ Database already has data, skipping seed"
fi

echo "✅ Setup completed"

# Iniciar aplicação em modo desenvolvimento
echo "🎯 Starting NestJS in development mode..."
exec npm run start:dev
