#!/bin/bash
# Script de limpeza segura da EC2 - Remove containers DEV preservando volumes
# Uso: bash scripts/cleanup-dev-ec2.sh

set -euo pipefail

echo "🧹 Limpeza segura da EC2 - Removendo containers DEV"
echo "=================================================="
echo ""

# Lista de containers DEV que podem ser removidos com segurança
DEV_CONTAINERS=(
  "backend-dev"
  "promata-backend-dev"
)

echo "📋 Containers DEV que serão removidos (se existirem):"
for container in "${DEV_CONTAINERS[@]}"; do
  echo "  - $container"
done
echo ""

# Parar e remover containers DEV
echo "⏸️  Parando containers DEV..."
for container in "${DEV_CONTAINERS[@]}"; do
  if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
    echo "  Parando: $container"
    docker stop "$container" 2>/dev/null || true
    echo "  Removendo: $container"
    docker rm "$container" 2>/dev/null || true
  else
    echo "  ⏭️  $container não encontrado (já removido)"
  fi
done

echo ""
echo "🗑️  Limpando imagens Docker não utilizadas..."
# Remove apenas imagens dangling (sem tag) e não utilizadas há mais de 24h
docker image prune -f --filter "until=24h" || true

echo ""
echo "📊 Verificando volumes (NÃO serão removidos)..."
echo "Volumes existentes:"
docker volume ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"

echo ""
echo "📊 Containers em execução após limpeza:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "💾 Uso de disco:"
df -h / | grep -v Filesystem

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "ℹ️  Observações:"
echo "  - Volumes de dados foram PRESERVADOS"
echo "  - Containers de PROD continuam rodando"
echo "  - Imagens antigas (>24h) foram removidas"
echo ""
echo "Para liberar mais espaço (CUIDADO - remove volumes não utilizados):"
echo "  docker volume prune -f"
echo ""
