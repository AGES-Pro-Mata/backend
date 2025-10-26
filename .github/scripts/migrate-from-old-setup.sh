#!/bin/bash
# Script para migrar do setup antigo (pastas separadas) para o novo (docker-compose unificado)
# Execute este script NO EC2 PROD antes do primeiro deploy do docker-compose.prod.yml

set -e

echo "🔄 Migrando do setup antigo para docker-compose unificado..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está rodando no servidor correto
if [ ! -d "$HOME/prod-db" ] || [ ! -d "$HOME/metabase-stack" ] || [ ! -d "$HOME/umami-stack" ]; then
  echo -e "${RED}❌ ERROR: Este script deve ser executado no servidor EC2 PROD com o setup antigo${NC}"
  echo -e "${YELLOW}   Pastas esperadas: ~/prod-db, ~/metabase-stack, ~/umami-stack${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Setup antigo detectado${NC}"

# Criar backup antes de qualquer coisa
BACKUP_DIR="$HOME/backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 Criando backup em: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Parar containers antigos
echo "⏸️  Parando containers antigos..."
docker stop backend-prod backend-dev umami metabase prod-postgres dev-postgres umami-db metabase-db 2>/dev/null || true

# Backup dos volumes
echo "💾 Fazendo backup dos volumes..."
docker run --rm \
  -v "$HOME/prod-db/data:/source:ro" \
  -v "$BACKUP_DIR:/backup" \
  alpine \
  tar czf /backup/prod-postgres-data.tar.gz -C /source .

echo -e "${GREEN}✅ Backup criado: $BACKUP_DIR/prod-postgres-data.tar.gz${NC}"

# Os volumes do Metabase e Umami JÁ EXISTEM como named volumes, então não precisa migrar
echo "ℹ️  Volumes do Metabase e Umami já estão como named volumes - serão reutilizados"

# Criar novo volume para PostgreSQL do Pro-Mata
echo "📦 Criando volume promata-postgres-data..."
docker volume create promata-postgres-data

# Migrar dados do bind mount antigo para o novo volume
echo "🔄 Migrando dados do PostgreSQL..."
docker run --rm \
  -v "$HOME/prod-db/data:/source:ro" \
  -v promata-postgres-data:/dest \
  alpine \
  sh -c "cp -av /source/. /dest/"

echo -e "${GREEN}✅ Dados migrados para o volume promata-postgres-data${NC}"

# Verificar migração
echo "🔍 Verificando migração..."
FILE_COUNT=$(docker run --rm -v promata-postgres-data:/data alpine sh -c "find /data -type f | wc -l")
echo "   Arquivos migrados: $FILE_COUNT"

if [ "$FILE_COUNT" -lt 10 ]; then
  echo -e "${RED}❌ ERRO: Poucos arquivos migrados. Verifique o backup!${NC}"
  exit 1
fi

# Remover containers antigos (opcional - deixe commented se quiser manter)
echo "🗑️  Removendo containers antigos..."
docker rm -f backend-prod backend-dev umami metabase prod-postgres dev-postgres umami-db metabase-db 2>/dev/null || true

# Limpar networks antigas (opcional)
echo "🗑️  Limpando networks antigas..."
docker network rm prod-db_default dev-db_default metabase_default umami_default 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Migração concluída com sucesso!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "   1. Deploy do novo docker-compose.prod.yml via GitHub Actions"
echo "   2. Verificar que todos os serviços subiram: docker compose -f docker-compose.prod.yml ps"
echo "   3. Testar acesso ao Metabase: http://metabase.promata.com.br"
echo "   4. Testar acesso ao Umami: http://analytics.promata.com.br"
echo "   5. Testar API: http://api.promata.com.br/health"
echo ""
echo "💾 Backup salvo em: $BACKUP_DIR"
echo "   Para restaurar em caso de problema:"
echo "   docker run --rm -v promata-postgres-data:/dest -v $BACKUP_DIR:/backup alpine tar xzf /backup/prod-postgres-data.tar.gz -C /dest"
echo ""
echo -e "${YELLOW}⚠️  NÃO DELETE as pastas antigas até confirmar que tudo está funcionando!${NC}"
