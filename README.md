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

#### 🔹 Desenvolvimento completo

```bash
docker compose --env-file .env.local --profile local up
```

Backend + banco PostgreSQL locais.

#### 🔹 Apenas banco de dados

```bash
docker compose --env-file .env.local --profile local up database
```
Para rodar backend localmente: `npm run start:local`

#### 🔹 Teste de TST e HLG

Basta substituir o arquivo `.env` para o determinado ambiente `.env.tst` ou `.env.hlg`, 
para ter acesso à esser arquivos deve-se entrar em contato com os AGES III e IV.

```bash
# Exemplo
docker compose --env-file .env.hlg up backend
# ou
docker compose --env-file .env.hlg up backend-watcher
```

Testa build de produção localmente.

#### 🔹 Testes automatizados

```bash
docker compose --env-file .env.local --profile test up
```

#### 🔹 Rodar local
```bash
npx run start:local
# ou
npx run start:tst
# ou
npx run start:hlg
```

#### 🔹 Prisma Studio

```bash
docker compose --env-file .env.local --profile studio up
```

Interface visual do banco: <http://localhost:5555>

## 🛠️ Variáveis de ambiente

### Arquivos disponíveis

- `.env.local` - Desenvolvimento local
- `.env.dev` - Staging/desenvolvimento
- `.env.prod` - Produção

### Principais variáveis

```bash
DATABASE_URL="postgresql://user:pass@host:port/db"
NODE_ENV=development|production
BACKEND_ENV=local|dev|prod
```

## 🐳 Docker

### Dockerfiles

- `Dockerfile.dev` - Desenvolvimento com hot reload
- `Dockerfile.prod` - Build otimizado para produção

### Scripts úteis

```bash
# Build das imagens
docker compose build

# Logs dos containers
docker compose logs -f

# Limpar volumes
docker compose down -v
```

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
