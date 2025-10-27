# 🔌 Acesso ao Ambiente de Desenvolvimento (DEV)

Este documento contém as informações de acesso ao ambiente DEV hospedado na EC2.

## 🌐 URLs de Acesso

### Backend API
```
http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010
```

**Healthcheck:**
```
http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010/health
```

**Documentação Swagger (se habilitada):**
```
http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010/api
```

### Database PostgreSQL
```
postgres://promata:promata123postgres@ec2-3-139-75-61.us-east-2.compute.amazonaws.com:5431/promata
```

**Detalhes da conexão:**
- **Host:** `ec2-3-139-75-61.us-east-2.compute.amazonaws.com`
- **Port:** `5431`
- **Database:** `promata`
- **User:** `promata`
- **Password:** `promata123postgres`

### Prisma Studio
```
http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:5555
```

## 📝 Configuração para Frontend

### Arquivo `.env` (Frontend)

```env
# Backend API DEV
VITE_API_URL=http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010
REACT_APP_API_URL=http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010
NEXT_PUBLIC_API_URL=http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010

# Caso precise acessar diretamente o banco (não recomendado para frontend)
DATABASE_URL=postgres://promata:promata123postgres@ec2-3-139-75-61.us-east-2.compute.amazonaws.com:5431/promata
```

### Exemplo de uso (JavaScript/TypeScript)

```typescript
// config/api.ts
const API_BASE_URL = 'http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010';

export const api = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: `${API_BASE_URL}/auth`,
    users: `${API_BASE_URL}/users`,
    // ... outros endpoints
  }
};
```

### Exemplo com Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api;
```

### Exemplo com Fetch

```typescript
const API_URL = 'http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010';

async function fetchData() {
  const response = await fetch(`${API_URL}/users`);
  const data = await response.json();
  return data;
}
```

## 🛠️ Ferramentas de Teste

### cURL

```bash
# Testar healthcheck
curl http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010/health

# Exemplo de POST
curl -X POST http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### HTTPie

```bash
# Testar healthcheck
http GET http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010/health

# Exemplo de POST
http POST http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010/auth/login \
  email=test@example.com \
  password=password123
```

### Postman / Insomnia

**Base URL para Collection:**
```
http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010
```

## 🗄️ Conectar ao Database

### DBeaver / pgAdmin

1. **Criar nova conexão PostgreSQL**
2. **Configurar:**
   - Host: `ec2-3-139-75-61.us-east-2.compute.amazonaws.com`
   - Port: `5431`
   - Database: `promata`
   - Username: `promata`
   - Password: `promata123postgres`

### psql (CLI)

```bash
psql postgres://promata:promata123postgres@ec2-3-139-75-61.us-east-2.compute.amazonaws.com:5431/promata
```

Ou:

```bash
psql -h ec2-3-139-75-61.us-east-2.compute.amazonaws.com \
     -p 5431 \
     -U promata \
     -d promata
```

## ⚠️ Importante

### Segurança
- **NÃO** use essas credenciais em produção
- **NÃO** commite arquivos `.env` com essas URLs no repositório
- Este ambiente é **apenas para desenvolvimento e testes**

### CORS
Se você encontrar problemas de CORS ao acessar do frontend:
1. Verifique se o backend tem CORS habilitado
2. Certifique-se de que a origem do frontend está permitida
3. Em desenvolvimento, pode ser necessário usar um proxy

### Disponibilidade
- O ambiente DEV é atualizado automaticamente a cada push na branch `dev`
- Durante deploys, pode haver breve indisponibilidade (~30 segundos)
- Os dados do banco podem ser resetados periodicamente para testes

## 🔄 Comparação DEV vs PROD

| Aspecto | DEV | PROD |
|---------|-----|------|
| URL Backend | `http://...com:3010` | `https://api.promata.com.br` |
| Porta Backend | 3010 | 443 (HTTPS) |
| Porta Database | 5431 | Não exposta |
| SSL/TLS | ❌ Não | ✅ Sim |
| CORS | ✅ Aberto | 🔒 Restrito |
| Deploy | Auto (branch dev) | Auto (branch main) |

## 📞 Suporte

Se o ambiente DEV estiver inacessível:
1. Verifique se o último deploy na branch `dev` foi bem-sucedido (GitHub Actions)
2. Teste o healthcheck: `curl http://ec2-3-139-75-61.us-east-2.compute.amazonaws.com:3010/health`
3. Contate o time de infraestrutura

---

**Última atualização:** 2025-10-26
