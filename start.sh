#!/bin/sh
set -e

echo "🚀 Pro-Mata Backend Starting..."
echo "Environment: ${NODE_ENV:-production}"

# Aguardar banco ficar disponível via pgbouncer
echo "⏳ Aguardando banco de dados..."
until nc -z ${DB_HOST:-pgbouncer} ${DB_PORT:-6432}; do
    echo "   Banco não disponível, tentando novamente..."
    sleep 2
done
echo "✅ Banco de dados disponível!"

# CORREÇÃO: Regenerar Prisma Client no runtime (importante para consistency)
echo "🔄 Regenerando Prisma Client..."
npx prisma generate

# Verificar conectividade simples com Prisma
if ! node -e "
const { PrismaClient } = require('@prisma/client'); 
new PrismaClient().\$connect()
  .then(() => console.log('✅ Prisma conectado'))
  .catch(e => {
    console.error('❌ Erro Prisma:', e.message); 
    process.exit(1);
  })
"; then
    echo "❌ Falha na conexão com banco"
    exit 1
fi

# Execute seed if requested (for demo/staging environments)
if [ "$RUN_SEED" = "true" ]; then
    echo "🌱 Executando seed do banco de dados..."
    if [ -f "prisma/seed.js" ]; then
        if node prisma/seed.js; then
            echo "✅ Seed executado com sucesso!"
        else
            echo "⚠️ Seed falhou, continuando com aplicação..."
        fi
    else
        echo "⚠️ Arquivo seed.js não encontrado"
    fi
fi

echo "🎯 Iniciando aplicação NestJS..."
exec node dist/main.js