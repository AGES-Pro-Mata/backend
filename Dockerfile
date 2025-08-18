FROM node:20-alpine AS base
WORKDIR /app
# prisma engines need OpenSSL; libc6-compat helps on alpine
RUN apk add --no-cache openssl libc6-compat

# Install deps and generate Prisma client
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# Build NestJS
FROM deps AS build
COPY . .
RUN npm run build

# Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000
# Applies migrations (if any) and starts the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
