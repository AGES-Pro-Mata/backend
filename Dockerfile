# Dockerfile.dev - Ambiente de desenvolvimento
FROM node:20-alpine AS dev

# Instalar dependências do sistema
RUN apk add --no-cache openssl libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Definir variáveis de ambiente para desenvolvimento
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true

# Copiar package.json e package-lock.json
COPY package*.json ./
COPY tsconfig.json ./

# Copiar schema do Prisma
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Gerar cliente Prisma
RUN npx prisma generate

# Verificar se foi gerado
RUN ls -la generated/ || echo "Generated folder not found"

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE $BACKEND_PORT

# Comando de desenvolvimento com hot reload
CMD ["sh", "-c", "npx prisma generate && npm run start:dev"]

# Dockerfile.dev - Ambiente de desenvolvimento
FROM node:20-alpine AS prod

# Instalar dependências do sistema
RUN apk add --no-cache openssl libc6-compat

# Definir diretório de trabalho
WORKDIR /app

# Definir variáveis de ambiente para desenvolvimento
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true

# Copiar package.json e package-lock.json
COPY package*.json ./

# Copiar schema do Prisma
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Gerar cliente Prisma
RUN npx prisma generate

# Verificar se foi gerado
RUN ls -la generated/ || echo "Generated folder not found"

RUN npm run build

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE $BACKEND_PORT

# Comando de desenvolvimento com hot reload
CMD ["npm", "run", "start:prod"]
