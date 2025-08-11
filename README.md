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
docker compose --env-file <caminho-do-arquivo-.env> up database
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

Todas as variáveis necessárias devem estar no arquivo development.env. Esse arquivo será utilizado tanto para subir o banco de dados quanto para definir o ambiente de execução da aplicação.
