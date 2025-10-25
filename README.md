# Pró-Mata Backend

Este repositório contém o backend do projeto Pró-Mata.

## 📦 Tecnologias

- Node.js 20
- NestJS
- PostgreSQL
- Prisma ORM
- Docker & Docker Compose

## 🚀 Como rodar o projeto?

### 1. Preparando o ambiente

Certifique-se de ter Docker instalado.

### 1.1 Dependências locais

Antes de rodar os containers, é importante instalar as dependências do projeto e o CLI do NestJS:

```bash
npm install          # Instala dependências do projeto
npm install -g @nestjs/cli  # Instala o NestJS CLI globalmente
```

### 2. Profiles de execução

O projeto utiliza **profiles** do `docker compose` para diferentes ambientes:

Copiar o `.env.exemple` para o `.env` para o desenvolvimento local.

#### 🔹 Desenvolvimento completo

```bash
docker compose up
```

Backend + banco PostgreSQL locais.

#### 🔹 Apenas banco de dados

```bash
docker compose up database
```

Para rodar backend localmente: `npm run start:dev` e mudar o host da URL do database no `.env` de `database` para `localhost`

#### 🔹 Rodar local

```bash
npx run start:dev
# ou
npx run start:tst
# ou
npx run start:hlg
```

#### 🔹 Prisma Studio

Via docker:

```bash
docker compose upprisma-studio
```

Local:

```bash
npx prisma studio
```

Interface visual do banco: <http://localhost:5555>

## 🐳 Docker

### Dockerfiles

- `Dockerfile` - Desenvolvimento local
- `Dockerfile.dev` - Desenvolvimento com hot reload
- `Dockerfile.prod` - Build otimizado para produção

## 🗄️ Banco de dados

### Comandos Prisma

```bash
# Gerar client
npx prisma generate

# Executar migrations
npx prisma migrate dev

# Reset do banco
npx prisma migrate reset
```

### Conexão

- Local: `database:5432` (dentro do Docker)
- Host: `localhost:5432`

⚠️ **Importante:** Para ambientes TST (Teste) e HLG (Homologação), entre em contato com os AGES III e IV.

## 🏗️ Infraestrutura e Ambientes

### Ambientes

O projeto possui os seguintes ambientes:

#### 🔵 Desenvolvimento (DEV)

- **Onde roda:** Localmente via `docker-compose.yml`
- **Como rodar:** `docker compose up`
- **Serviços inclusos:**
  - Backend NestJS (porta 3000)
  - PostgreSQL (porta 5432)
  - Umami Analytics (porta 5050)
  - Metabase (porta 3001)
  - Prisma Studio (porta 5555)

**Importante:** O ambiente DEV **NÃO** é mais deployado na EC2 automaticamente. Sempre rode localmente para economizar recursos da infraestrutura.

#### 🟢 Produção (PROD)

- **Onde roda:** EC2 AWS via Docker Compose
- **Arquivo:** `docker-compose.prod.yml`
- **Deploy:** Automático via GitHub Actions quando há merge na branch `main`
- **Stack completa:**
  - Traefik (reverse proxy + SSL/TLS Let's Encrypt)
  - Backend NestJS
  - PostgreSQL
  - Umami Analytics
  - Metabase
  - Prisma Studio
  - Frontend Proxy (Nginx → S3)

### CI/CD

#### Build e Publish

- Arquivo: `.github/workflows/ci-cd.yml`
- Triggers:
  - Push na branch `dev`: builda imagem Docker DEV
  - Push na branch `main`: builda imagem Docker PROD

#### Deploy Produção

- Arquivo: `.github/workflows/deploy-compose.yml`
- Trigger: Após sucesso do workflow `ci-cd.yml` na branch `main`
- Ações:
  - Faz pull das imagens mais recentes
  - Atualiza serviços via `docker-compose.prod.yml`
  - Executa migrations do Prisma
  - Inclui migração automática de setup legado

### Recursos da EC2

A instância EC2 de produção é uma **t2.medium** (2 vCPUs, 4 GB RAM). Por limitações de recursos, apenas o ambiente de **PRODUÇÃO** roda na EC2. O ambiente de **DESENVOLVIMENTO** deve ser executado localmente.

### Limpeza de Containers DEV na EC2

Se você tinha containers DEV rodando na EC2 antes desta mudança, use o script de limpeza para removê-los com segurança:

```bash
# Na EC2 (via SSH)
bash scripts/cleanup-dev-ec2.sh
```

Este script:

- Remove containers DEV antigos
- **Preserva todos os volumes de dados**
- Limpa imagens Docker não utilizadas (>24h)
- Mantém containers PROD intactos
- Mostra relatório de recursos após limpeza

**Importante:** O script NÃO remove volumes. Para remover volumes não utilizados manualmente (use com cuidado):

```bash
docker volume prune -f
```
