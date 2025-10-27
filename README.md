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

- **Onde roda:** EC2 AWS via Docker Compose (mesma máquina que PROD)
- **Arquivo:** `docker-compose.dev.yml`
- **Deploy:** Automático via GitHub Actions quando há push na branch `dev`
- **Serviços inclusos:**
  - Backend NestJS (porta 3010 - externa)
  - PostgreSQL (porta 5431 - externa)
  - Prisma Studio (porta 5555 - externa)
- **URLs de acesso:**
  - Backend API: `http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010`
  - Health Check: `http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010/health`
  - Prisma Studio: `http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:5555`
  - Database: `postgres://promata:promata123postgres@ec2-3-139-75-61.us-east-2.compute.amazonaws.com:5431/promata`

**Importante:** DEV e PROD rodam lado a lado na mesma EC2, mas com **portas diferentes** para evitar conflitos.

📋 **Para configuração completa do frontend e ferramentas de teste, veja [DEV-ACCESS.md](DEV-ACCESS.md)**

#### 🟢 Produção (PROD)

- **Onde roda:** EC2 AWS via Docker Compose (mesma máquina que DEV)
- **Arquivo:** `docker-compose.prod.yml`
- **Deploy:** Automático via GitHub Actions quando há push na branch `main`
- **Stack completa:**
  - Traefik (reverse proxy + SSL/TLS Let's Encrypt)
  - Backend NestJS (porta interna 3000, exposto via Traefik)
  - PostgreSQL (porta interna 5432)
  - Umami Analytics
  - Metabase
  - Prisma Studio
  - Frontend Proxy (Nginx → S3)
- **URLs de acesso:**
  - Backend API: `https://api.promata.com.br`
  - Frontend: `https://promata.com.br`
  - Analytics: `https://analytics.promata.com.br`
  - Metabase: `https://metabase.promata.com.br`
  - Prisma Studio: `https://prisma.promata.com.br`

### CI/CD

#### Build e Publish

- Arquivo: `.github/workflows/ci-cd.yml`
- Imagens Docker publicadas:
  - **DEV**: `norohim/pro-mata-backend-dev:latest` (branch `dev`)
  - **PROD**: `norohim/pro-mata-backend:latest` (branch `main`)
- Nota: Database usa imagem oficial `postgres:15-alpine`, Frontend está no S3

#### Deploy Automático

- Arquivo: `.github/workflows/deploy-compose.yml`
- Triggers:
  - **DEV**: Após sucesso do workflow `ci-cd.yml` na branch `dev`
  - **PROD**: Após sucesso do workflow `ci-cd.yml` na branch `main`
- Ações (para cada ambiente):
  - Clona/atualiza o repositório na EC2 (`/opt/promata-backend-dev` ou `/opt/promata-backend`)
  - Cria arquivo `.env` com secrets do GitHub
  - Faz pull das imagens mais recentes do Docker Hub
  - Atualiza serviços via `docker-compose.dev.yml` ou `docker-compose.prod.yml`
  - Executa migrations do Prisma
  - Limpa imagens antigas

#### Deploy Manual

Caso precise fazer deploy manual (sem usar CI/CD):

```bash
# No servidor EC2 via SSH
cd /opt/promata-backend-dev    # Para DEV
# ou
cd /opt/promata-backend         # Para PROD

# Criar .env.dev ou .env.production com as variáveis necessárias
# Em seguida:
./deploy-dev.sh    # Para DEV
```

### Recursos da EC2

A instância EC2 é uma **t2.medium** (2 vCPUs, 4 GB RAM) que hospeda **ambos** os ambientes DEV e PROD simultaneamente, utilizando **portas diferentes** para evitar conflitos:

| Ambiente | Backend | Database | Prisma Studio |
|----------|---------|----------|---------------|
| DEV      | 3010    | 5431     | 5555          |
| PROD     | 3000*   | 5432*    | 5555*         |

\* _Portas internas, expostas via Traefik com SSL/TLS_

**Mapeamento de portas DEV:**

- Backend: `3010:3010` (host:container)
- Database: `5431:5432` (host:container)
- Prisma Studio: `5555:5555` (host:container)

### Secrets e Variáveis de Ambiente

Configure os seguintes secrets no GitHub Actions para deploy automático:

#### Secrets de Infraestrutura (Obrigatórios)

- `DEV_EC2_HOST` - Host/IP da EC2
- `DEV_EC2_USER` - Usuário SSH (geralmente `ubuntu`)
- `DEV_EC2_SSH_KEY` - Chave privada SSH para acesso
- `PROD_EC2_HOST` - Host/IP da EC2 (pode ser o mesmo que DEV)
- `PROD_EC2_USER` - Usuário SSH (geralmente `ubuntu`)
- `PROD_EC2_SSH_KEY` - Chave privada SSH para acesso

#### Secrets de Aplicação (Obrigatórios)

**DEV:**

- `DEV_DATABASE_URL` - URL de conexão PostgreSQL DEV
- `DEV_JWT_SECRET` - Secret para JWT tokens DEV
- `DEV_POSTGRES_PASSWORD` - Senha do PostgreSQL DEV
- `DEV_AWS_S3_BUCKET` - Nome do bucket S3 DEV (opcional)

**PROD:**

- `PROD_DATABASE_URL` - URL de conexão PostgreSQL PROD
- `PROD_JWT_SECRET` - Secret para JWT tokens PROD
- `POSTGRES_PASSWORD` - Senha do PostgreSQL PROD
- `PROD_AWS_S3_BUCKET` - Nome do bucket S3 PROD

**Compartilhados (DEV e PROD):**

- `AWS_ACCESS_KEY_ID` - Credenciais AWS S3
- `AWS_SECRET_ACCESS_KEY` - Credenciais AWS S3
- `CF_API_EMAIL` - Email Cloudflare (para SSL - apenas PROD)
- `CF_DNS_API_TOKEN` - Token API Cloudflare (para SSL - apenas PROD)

#### Opcionais (com valores padrão)

- `POSTGRES_DB` (padrão: `promata`)
- `POSTGRES_USER` (padrão: `admin`)
- `POSTGRES_PASSWORD` (obrigatório em PROD)
- `UMAMI_APP_SECRET` (padrão fornecido - **MUDE EM PRODUÇÃO**)
- `UMAMI_DB_USER` (padrão: `umami`)
- `UMAMI_DB_PASSWORD` (padrão: `umami`)
- `UMAMI_DB_NAME` (padrão: `umami`)
- `METABASE_DB_USER` (padrão: `metabase`)
- `METABASE_DB_PASSWORD` (padrão: `metabase123`)
- `METABASE_DB_NAME` (padrão: `metabase`)
- `ACME_EMAIL` (padrão: `admin@promata.com.br`)

#### Como gerar UMAMI_APP_SECRET

O Umami requer um secret base64-encoded. Gere um novo secret com:

```bash
openssl rand -base64 32
```

Exemplo de output:

```text
1ROqCXlzGzCkeRfWvcUUqycuwEeCA+TN4YkI1XrXjUg=
```

Use esse valor no GitHub Secret `UMAMI_APP_SECRET`.

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
