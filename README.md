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
