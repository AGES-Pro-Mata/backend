#!/bin/bash
set -euo pipefail

# Script de deploy do Metabase via Docker Compose
# Requer as seguintes variáveis de ambiente:
# - METABASE_DB_NAME, METABASE_DB_USER, METABASE_DB_PASSWORD
# Opcionais:
# - METABASE_DB_PORT (default: 5432)
# - METABASE_HOST_PORT (default: 3001)
# - METABASE_SITE_URL
# - METABASE_ENCRYPTION_KEY

WORKDIR="$HOME/metabase-stack"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

# Validar variáveis obrigatórias
: "${METABASE_DB_NAME:?METABASE_DB_NAME must be set}"
: "${METABASE_DB_USER:?METABASE_DB_USER must be set}"
: "${METABASE_DB_PASSWORD:?METABASE_DB_PASSWORD must be set}"

# Definir valores padrão
METABASE_DB_PORT=${METABASE_DB_PORT:-5432}
METABASE_HOST_PORT=${METABASE_HOST_PORT:-3001}

echo "📦 Generating docker-compose.yml for Metabase..."

cat <<EOF > docker-compose.yml
version: "3.8"
services:
  metabase-db:
    image: postgres:15-alpine
    container_name: metabase-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${METABASE_DB_NAME}
      POSTGRES_USER: ${METABASE_DB_USER}
      POSTGRES_PASSWORD: ${METABASE_DB_PASSWORD}
    volumes:
      - metabase-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${METABASE_DB_USER} -d ${METABASE_DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  metabase:
    image: metabase/metabase:latest
    container_name: metabase
    restart: unless-stopped
    depends_on:
      metabase-db:
        condition: service_healthy
    environment:
      MB_DB_TYPE: postgres
      MB_DB_DBNAME: ${METABASE_DB_NAME}
      MB_DB_PORT: ${METABASE_DB_PORT}
      MB_DB_USER: ${METABASE_DB_USER}
      MB_DB_PASS: ${METABASE_DB_PASSWORD}
      MB_DB_HOST: metabase-db
    ports:
      - "${METABASE_HOST_PORT}:3000"
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  metabase-db-data:
    name: metabase-db-data
EOF

echo "🔄 Pulling latest images..."
docker compose -p metabase pull

echo "🚀 Starting Metabase stack..."
docker compose -p metabase up -d --remove-orphans

echo "✅ Metabase deployed successfully!"
docker compose -p metabase ps
