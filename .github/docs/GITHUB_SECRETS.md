# GitHub Actions - Secrets e Variáveis Necessárias

Este documento lista todos os **Secrets** e **Variables** que devem ser configurados no GitHub Actions para o funcionamento correto do CI/CD.

## Como Configurar

1. Acesse o repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Adicione os secrets listados abaixo

---

## 📦 Secrets Necessários

### 🔐 Credenciais do Docker Hub

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `DOCKER_PASSWORD` | Token de acesso do Docker Hub | `dckr_pat_xxxxxxxxxxxxx` |

### 🖥️ Acesso SSH aos Servidores EC2

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `DEV_EC2_HOST` | IP ou hostname do servidor DEV | `ec2-XX-XXX-XX-XX.compute.amazonaws.com` |
| `DEV_EC2_USER` | Usuário SSH do servidor DEV | `ubuntu` ou `ec2-user` |
| `DEV_EC2_SSH_KEY` | Chave privada SSH para DEV (conteúdo completo) | `-----BEGIN RSA PRIVATE KEY-----\n...` |
| `PROD_EC2_HOST` | IP ou hostname do servidor PROD | `ec2-XX-XXX-XX-XX.compute.amazonaws.com` |
| `PROD_EC2_USER` | Usuário SSH do servidor PROD | `ubuntu` ou `ec2-user` |
| `PROD_EC2_SSH_KEY` | Chave privada SSH para PROD (conteúdo completo) | `-----BEGIN RSA PRIVATE KEY-----\n...` |

### 🗄️ Database - DEV

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `DEV_DATABASE_URL` | Connection string PostgreSQL DEV | `postgresql://user:password@host:5432/promata-dev` |

### 🗄️ Database - PROD

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `PROD_DATABASE_URL` | Connection string PostgreSQL PROD | `postgresql://user:password@host:5432/promata` |
| `POSTGRES_DB` | Nome do database PROD | `promata` |
| `POSTGRES_USER` | Usuário do PostgreSQL PROD | `admin` ou `promata` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL PROD | `your-secure-password` |

### 🔑 JWT (Authentication)

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `PROD_JWT_SECRET` | Secret para assinatura de tokens JWT | Qualquer string aleatória segura (min 32 chars) |

### ☁️ AWS Credentials

| Secret | Descrição | Como Obter |
|--------|-----------|------------|
| `AWS_ACCESS_KEY_ID` | Access Key ID da AWS | Console AWS → IAM → Users → Security Credentials |
| `AWS_SECRET_ACCESS_KEY` | Secret Access Key da AWS | Console AWS → IAM → Users → Security Credentials |
| `DEV_AWS_S3_BUCKET` | Nome do bucket S3 para DEV | `promata-dev-frontend` ou similar |
| `PROD_AWS_S3_BUCKET` | Nome do bucket S3 para PROD | `promata-frontend` ou similar |

### 🌐 Cloudflare (DNS Challenge para TLS)

**IMPORTANTE:** Estes secrets são obrigatórios para funcionamento do Let's Encrypt com DNS Challenge.

| Secret | Descrição | Como Obter |
|--------|-----------|------------|
| `CF_API_EMAIL` | Email da conta Cloudflare | Seu email de login no Cloudflare |
| `CF_DNS_API_TOKEN` | API Token do Cloudflare com permissões DNS | Ver instruções abaixo ⬇️ |
| `ACME_EMAIL` | Email para notificações Let's Encrypt | `admin@promata.com.br` ou seu email |

#### Como Criar o `CF_DNS_API_TOKEN`

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vá em **My Profile** → **API Tokens**
3. Clique em **Create Token**
4. Use o template **Edit zone DNS** ou crie custom com:
   - **Permissions:**
     - `Zone` → `DNS` → `Edit`
     - `Zone` → `Zone` → `Read`
   - **Zone Resources:**
     - `Include` → `Specific zone` → `promata.com.br`
5. Copie o token gerado (só aparece uma vez!)

### 📊 Umami Analytics

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `UMAMI_DB_USER` | Usuário do database Umami | `umami` |
| `UMAMI_DB_PASSWORD` | Senha do database Umami | Senha segura |
| `UMAMI_DB_NAME` | Nome do database Umami | `umami` |
| `UMAMI_APP_SECRET` | Secret interno do Umami | String aleatória (min 32 chars) |
| `UMAMI_URL` | URL do Umami (opcional) | `https://analytics.promata.com.br` |
| `UMAMI_WEBSITE_ID` | ID do website no Umami (opcional) | UUID do website |

### 📈 Metabase

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `METABASE_DB_USER` | Usuário do database Metabase | `metabase` |
| `METABASE_DB_PASSWORD` | Senha do database Metabase | Senha segura |
| `METABASE_DB_NAME` | Nome do database Metabase | `metabase` |

### 🐳 Docker Deploy Config (para ci-cd.yml standalone DEV)

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `DEV_DOCKER_CONTAINER_NAME` | Nome do container backend DEV | `promata-backend-dev` |
| `DEV_DOCKER_PORT_MAPPING` | Mapeamento de portas DEV | `3000:3000` |
| `DEV_DOCKER_ENV_FILE` | Arquivo .env adicional (opcional) | `/path/to/.env` ou vazio |
| `DEV_DOCKER_EXTRA_ARGS` | Args extras docker run (opcional) | `--network promata-network` ou vazio |

---

## 🔧 Variables (não secretas)

No mesmo menu do GitHub, aba **Variables**, adicione:

| Variable | Descrição | Valor |
|----------|-----------|-------|
| `DOCKER_USERNAME` | Username do Docker Hub | `seu-usuario` (ex: `norohim`) |
| `AWS_REGION` | Região AWS do S3 | `us-east-2` ou sua região |

---

## ✅ Checklist de Configuração

Marque conforme for adicionando os secrets:

### Docker & GitHub

- [ ] `DOCKER_PASSWORD`
- [ ] `DOCKER_USERNAME` (variable)

### EC2 Servers

- [ ] `DEV_EC2_HOST`
- [ ] `DEV_EC2_USER`
- [ ] `DEV_EC2_SSH_KEY`
- [ ] `PROD_EC2_HOST`
- [ ] `PROD_EC2_USER`
- [ ] `PROD_EC2_SSH_KEY`

### Database

- [ ] `DEV_DATABASE_URL`
- [ ] `PROD_DATABASE_URL`
- [ ] `POSTGRES_DB`
- [ ] `POSTGRES_USER`
- [ ] `POSTGRES_PASSWORD`

### Application

- [ ] `PROD_JWT_SECRET`

### AWS

- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION` (variable)
- [ ] `DEV_AWS_S3_BUCKET`
- [ ] `PROD_AWS_S3_BUCKET`

### Cloudflare (TLS/DNS)

- [ ] `CF_API_EMAIL`
- [ ] `CF_DNS_API_TOKEN`
- [ ] `ACME_EMAIL`

### Analytics & BI

- [ ] `UMAMI_DB_USER`
- [ ] `UMAMI_DB_PASSWORD`
- [ ] `UMAMI_DB_NAME`
- [ ] `UMAMI_APP_SECRET`
- [ ] `UMAMI_URL` (opcional)
- [ ] `UMAMI_WEBSITE_ID` (opcional)
- [ ] `METABASE_DB_USER`
- [ ] `METABASE_DB_PASSWORD`
- [ ] `METABASE_DB_NAME`

### Docker Deploy (DEV standalone)

- [ ] `DEV_DOCKER_CONTAINER_NAME`
- [ ] `DEV_DOCKER_PORT_MAPPING`
- [ ] `DEV_DOCKER_ENV_FILE` (opcional)
- [ ] `DEV_DOCKER_EXTRA_ARGS` (opcional)

---

## 🔗 Recursos Úteis

- [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
- [AWS IAM Console](https://console.aws.amazon.com/iam/)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Let's Encrypt DNS Challenge](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge)

---

## ⚠️ Notas de Segurança

1. **NUNCA** commite secrets no código
2. **Rotacione** as credenciais regularmente (especialmente tokens e passwords)
3. **Use** senhas fortes geradas automaticamente (min 32 caracteres)
4. **Limite** permissões do Cloudflare API Token apenas ao necessário
5. **Monitore** o uso das credenciais AWS no billing dashboard
6. **Revogue** imediatamente qualquer credencial comprometida

---

## 📝 Gerando Valores Aleatórios Seguros

Para gerar secrets aleatórios fortes:

```bash
# JWT_SECRET, UMAMI_APP_SECRET, etc (64 caracteres)
openssl rand -hex 32

# Ou usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Senha segura (32 caracteres alfanuméricos + símbolos)
openssl rand -base64 32
```

---

**Última atualização:** 2025-01-25
