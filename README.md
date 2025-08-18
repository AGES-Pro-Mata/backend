# Pró-Mata Backend
Este repositório contém o backend do projeto Pró-Mata.

## 📦 Tecnologias
- Node.js
- NestJS
- DynamoDB (via Docker)

## 🚀 Como rodar o projeto?

1. Preparando o ambiente
Antes de iniciar, certifique-se de ter:

Docker instalado.

Arquivo .env configurado com as variáveis de ambiente necessárias (banco local, TST e HLG).

Lembre-se de rodar:
```bash
npm install
```

as dependências do `node_modules` não são necessárias para rodar o projeto via docker, mas ainda precisa-se delas para ter o "auto-complete" do editor de texto

---

### 2. Perfis de execução

O projeto utiliza **profiles** do `docker compose` para facilitar a execução em diferentes ambientes.

#### 🔹 Ambiente local sem o docker (backend + banco local)

```bash
docker compose --profile local up database
```

Este comando somente **o banco local**.

```bash
npm run start:local
```

Este comando inicia o **servidor localmente**.

#### 🔹 Ambiente local (backend + banco local)

```bash
docker compose --profile local up
```

Este comando sobe **o backend** e **o banco local** juntos.


    ⚠️ Se estiver dando um erro de conexão no banco de dados basta mudar o `localhost` no `.env.local` para `database`.


#### 🔹 Backend local + banco TST

```bash
docker compose --profile tst up
```

Sobe o backend localmente, mas utilizando **o banco de dados do ambiente TST**.


#### 🔹 Backend local + banco HLG

```bash
docker compose --profile hlg up
```

Sobe o backend localmente, mas utilizando **o banco de dados do ambiente HLG**.

---

## 🛠️ Variáveis de ambiente

Variáveis de ambientes estão localizadas nos arquivos .env.local, .env.tst e .env.hlg.
  
  ⚠️ Importante: Para ter acesso as variáveis de ambiente TST e HLG entre em contato com os AGES III e IV.

