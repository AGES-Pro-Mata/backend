#!/bin/bash
set -euo pipefail

# Script de deploy do Umami via Docker Compose
# Requer as seguintes variáveis de ambiente:
# - UMAMI_DB_NAME, UMAMI_DB_USER, UMAMI_DB_PASSWORD
# - UMAMI_APP_SECRET, UMAMI_ADMIN_EMAIL, UMAMI_ADMIN_PASSWORD
# Opcionais:
# - UMAMI_DB_PORT (default: 5432)
# - UMAMI_HOST_PORT (default: 5050)

WORKDIR="$HOME/umami-stack"
mkdir -p "$WORKDIR"
cd "$WORKDIR"

# Validar variáveis obrigatórias
: "${UMAMI_DB_NAME:?UMAMI_DB_NAME must be set}"
: "${UMAMI_DB_USER:?UMAMI_DB_USER must be set}"
: "${UMAMI_DB_PASSWORD:?UMAMI_DB_PASSWORD must be set}"
: "${UMAMI_APP_SECRET:?UMAMI_APP_SECRET must be set}"
: "${UMAMI_ADMIN_EMAIL:?UMAMI_ADMIN_EMAIL must be set}"
: "${UMAMI_ADMIN_PASSWORD:?UMAMI_ADMIN_PASSWORD must be set}"

# Definir valores padrão
UMAMI_DB_PORT=${UMAMI_DB_PORT:-5432}
UMAMI_HOST_PORT=${UMAMI_HOST_PORT:-5050}

echo "📦 Generating docker-compose.yml for Umami..."

cat <<EOF > docker-compose.yml
version: "3.8"
services:
  umami-db:
    image: postgres:15-alpine
    container_name: umami-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${UMAMI_DB_NAME}
      POSTGRES_USER: ${UMAMI_DB_USER}
      POSTGRES_PASSWORD: ${UMAMI_DB_PASSWORD}
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${UMAMI_DB_USER} -d ${UMAMI_DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    container_name: umami
    restart: unless-stopped
    depends_on:
      umami-db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://${UMAMI_DB_USER}:${UMAMI_DB_PASSWORD}@umami-db:${UMAMI_DB_PORT}/${UMAMI_DB_NAME}
      DATABASE_TYPE: postgresql
      APP_SECRET: ${UMAMI_APP_SECRET}
      ADMIN_EMAIL: ${UMAMI_ADMIN_EMAIL}
      ADMIN_PASSWORD: ${UMAMI_ADMIN_PASSWORD}
    ports:
      - "${UMAMI_HOST_PORT}:3000"
    healthcheck:
      test: ["CMD-SHELL", "curl -sf http://localhost:3000/api/heartbeat || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  umami-db-data:
    name: umami-db-data
EOF

echo "🔄 Pulling latest images..."
docker compose -p umami pull

echo "🚀 Starting Umami stack..."
docker compose -p umami up -d --remove-orphans

echo "✅ Umami deployed successfully!"
docker compose -p umami ps
