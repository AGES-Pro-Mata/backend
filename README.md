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

### 2. Perfis de execução

O projeto utiliza **profiles** do `docker compose` para facilitar a execução em diferentes ambientes.

#### 🔹 Ambiente local (backend + banco local)

```bash
docker compose --profile local up
```

Este comando sobe **o backend** e **o banco local** juntos.

---

#### 🔹 Backend local + banco TST

```bash
docker compose --profile tst up
```

Sobe o backend localmente, mas utilizando **o banco de dados do ambiente TST**.

---

#### 🔹 Backend local + banco HLG

```bash
docker compose --profile hlg up
```

Sobe o backend localmente, mas utilizando **o banco de dados do ambiente HLG**.

---

## 🛠️ Variáveis de ambiente

Variáveis de ambientes estão localizadas nos arquivos .env.local, .env.tst e .env.hlg.
  
  ⚠️ Importante: Para ter acesso as variáveis de ambiente TST e HLG entre em contato com os AGES III e IV.

