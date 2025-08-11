# Pró-Mata Backend
Este repositório contém o backend do projeto Pró-Mata.

## 📦 Tecnologias
- Node.js
- NestJS
- DynamoDB (via Docker)

## 🚀 Como rodar o projeto?

### 1. Rodando com banco de dados local

Certifique-se de ter o Docker instalado e configurado. Para iniciar o banco de dados localmente:

```bash
docker compose --env-file .env.local up database
```

Em seguida, para iniciar o servidor local:

```bash
npm run start:local
```

### 2. Rodando com banco de dados de homologação (hlg) ou testes (tst)

    ⚠️ Importante: essas opções ainda estão em desenvolvimento (TODO).

```bash
# Usando banco de dados de teste (TST)
npm run start:tst

# Usando banco de dados de homologação (HLG)
npm run start:hlg
```

## 🛠️ Variáveis de ambiente

Variáveis de ambientes estão localizadas nos arquivos .env.local, .env.tst e .env.hlg.
  
  ⚠️ Importante: Para ter acesso as variáveis de ambiente TST e HLG entre em contato com os AGES III e IV.
