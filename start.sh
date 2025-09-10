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

echo "🎯 Iniciando aplicação NestJS..."
exec node dist/main.js