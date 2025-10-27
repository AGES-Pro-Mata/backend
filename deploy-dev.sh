#!/bin/bash

# Script para Deploy Manual do Ambiente de Desenvolvimento
# Normalmente o deploy é feito automaticamente via CI/CD (branch dev)
# Use este script apenas para deploy manual local
# Uso: ./deploy-dev.sh

set -e

echo "========================================="
echo "  Promata - Deploy Manual Ambiente DEV"
echo "========================================="
echo ""

# Verificar se o arquivo .env.dev existe
if [ ! -f .env.dev ]; then
    echo "❌ Erro: Arquivo .env.dev não encontrado!"
    echo "📝 Crie o arquivo .env.dev com as variáveis necessárias"
    echo ""
    echo "Exemplo mínimo:"
    echo "DOCKER_REGISTRY=docker.io"
    echo "IMAGE_NAME=norohim/pro-mata-backend"
    echo "IMAGE_TAG=dev"
    echo "CONTAINER_NAME=promata-dev-backend"
    echo "BACKEND_PORT=3010"
    echo "DATABASE_URL=postgresql://promata:promata123postgres@database:5432/promata"
    echo "POSTGRES_PASSWORD=promata123postgres"
    echo "JWT_SECRET=your-secret-here"
    exit 1
fi

# Criar volumes se não existirem
echo "📦 Verificando volumes..."
docker volume create promata-dev-postgres-data 2>/dev/null || true
docker volume create promata-dev-backend-node-modules 2>/dev/null || true

# Pull da imagem mais recente do Docker Hub
echo "📥 Baixando imagem mais recente do Docker Hub..."
docker compose -f docker-compose.dev.yml --env-file .env.dev pull

# Parar containers antigos se existirem
echo "🛑 Parando containers antigos..."
docker compose -f docker-compose.dev.yml --env-file .env.dev down 2>/dev/null || true

# Iniciar containers
echo "🚀 Iniciando containers..."
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d

# Aguardar containers ficarem prontos
echo "⏳ Aguardando containers ficarem prontos..."
sleep 15

# Executar migrations
echo "🔄 Executando migrations..."
docker compose -f docker-compose.dev.yml --env-file .env.dev exec -T backend npx prisma migrate deploy || echo "⚠️  Migrations já aplicadas ou erro"

# Verificar status
echo ""
echo "📊 Status dos containers:"
docker compose -f docker-compose.dev.yml --env-file .env.dev ps

# Verificar health
echo ""
echo "🏥 Verificando health dos serviços..."
sleep 5

BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' promata-dev-backend 2>/dev/null || echo "não encontrado")
DB_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' promata-dev-database 2>/dev/null || echo "não encontrado")

echo "  - Backend: $BACKEND_HEALTH"
echo "  - Database: $DB_HEALTH"

# Mostrar URLs de acesso
echo ""
echo "========================================="
echo "  ✅ Deploy DEV concluído!"
echo "========================================="
echo ""
echo "📍 URLs de acesso:"
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
echo "  - Backend:       http://${PUBLIC_IP}:3010"
echo "  - Health Check:  http://${PUBLIC_IP}:3010/health"
echo "  - Prisma Studio: http://${PUBLIC_IP}:5555"
echo "  - Database:      postgres://promata:promata123postgres@${PUBLIC_IP}:5431/promata"
echo ""
echo "📝 Comandos úteis:"
echo "  Ver logs:        docker compose -f docker-compose.dev.yml --env-file .env.dev logs -f"
echo "  Parar serviços:  docker compose -f docker-compose.dev.yml --env-file .env.dev down"
echo "  Restart:         docker compose -f docker-compose.dev.yml --env-file .env.dev restart"
echo ""
