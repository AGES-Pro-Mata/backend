#!/bin/bash

# Script de desenvolvimento Pro-Mata Backend
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de ajuda
show_help() {
    echo -e "${BLUE}Pro-Mata Backend Development Script${NC}"
    echo ""
    echo "Uso: ./scripts/dev.sh [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  setup       - Configuração inicial do projeto"
    echo "  dev         - Iniciar ambiente de desenvolvimento"
    echo "  prod        - Testar build de produção"
    echo "  test        - Executar testes"
    echo "  db:reset    - Reset completo do banco de dados"
    echo "  db:studio   - Abrir Prisma Studio"
    echo "  clean       - Limpar containers e volumes"
    echo "  logs        - Ver logs dos containers"
    echo "  build       - Build das imagens Docker"
    echo ""
}

# Configuração inicial
setup() {
    echo -e "${BLUE}🚀 Configurando ambiente de desenvolvimento...${NC}"
    
    if [ ! -f ".env.local" ]; then
        echo -e "${YELLOW}Criando .env.local...${NC}"
        cp .env.local.example .env.local 2>/dev/null || echo -e "${RED}Arquivo .env.local.example não encontrado${NC}"
    fi
    
    echo -e "${BLUE}Instalando dependências...${NC}"
    npm install
    
    echo -e "${BLUE}Gerando cliente Prisma...${NC}"
    npx prisma generate
    
    echo -e "${GREEN}✅ Setup concluído!${NC}"
}

# Desenvolvimento
dev() {
    echo -e "${BLUE}🔧 Iniciando ambiente de desenvolvimento...${NC}"
    docker compose --env-file .env.local --profile local up -d
}

# Produção (teste)
prod() {
    echo -e "${BLUE}🏭 Testando build de produção...${NC}"
    docker compose --env-file .env.local --profile prod-test up -d
}

# Testes
test() {
    echo -e "${BLUE}🧪 Executando testes...${NC}"
    docker compose --env-file .env.local --profile test up --abort-on-container-exit
}

# Reset banco
db_reset() {
    echo -e "${YELLOW}⚠️  Resetando banco de dados...${NC}"
    docker compose --env-file .env.local down -v
    docker compose --env-file .env.local --profile local up -d database
    sleep 5
    npx prisma migrate reset --force
    echo -e "${GREEN}✅ Banco resetado!${NC}"
}

# Prisma Studio
db_studio() {
    echo -e "${BLUE}🎨 Abrindo Prisma Studio...${NC}"
    docker compose --env-file .env.local --profile studio up -d
    echo -e "${GREEN}Prisma Studio disponível em: http://localhost:5555${NC}"
}

# Limpeza
clean() {
    echo -e "${YELLOW}🧹 Limpando containers e volumes...${NC}"
    docker compose --env-file .env.local down -v
    docker system prune -f
    echo -e "${GREEN}✅ Limpeza concluída!${NC}"
}

# Logs
logs() {
    echo -e "${BLUE}📋 Visualizando logs...${NC}"
    docker compose --env-file .env.local logs -f
}

# Build
build() {
    echo -e "${BLUE}🔨 Fazendo build das imagens...${NC}"
    docker compose --env-file .env.local build
    echo -e "${GREEN}✅ Build concluído!${NC}"
}

# Processar comando
case $1 in
    setup)
        setup
        ;;
    dev)
        dev
        ;;
    prod)
        prod
        ;;
    test)
        test
        ;;
    db:reset)
        db_reset
        ;;
    db:studio)
        db_studio
        ;;
    clean)
        clean
        ;;
    logs)
        logs
        ;;
    build)
        build
        ;;
    *)
        show_help
        ;;
esac