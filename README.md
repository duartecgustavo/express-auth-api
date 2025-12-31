## 🔐 Boilerplate API de Autenticação

Sistema de autenticação completo com Clean Architecture, SOLID e TypeScript pronto para produção.

### 📋 Sobre o Projeto
Este é um boilerplate de autenticação construído com as melhores práticas de arquitetura de software. Ideal para iniciar novos projetos que precisam de um sistema robusto de autenticação e gerenciamento de usuários.

>🤖 Nota: Este readme foi escrito com auxílio de IA (Claude), porém esta 100% revisado.

---
### ✨ Características Principais

🏗️ Clean Architecture - Código organizado em camadas bem definidas

🎯 SOLID Principles - Princípios de design orientado a objetos

🔒 JWT Authentication - Access e Refresh tokens

✅ Validação de Dados - DTOs com class-validator

🛡️ Segurança - Helmet, CORS, rate limiting

📦 TypeORM - ORM TypeScript com suporte a migrations

🎨 Dependency Injection - Facilita testes e manutenção

📝 TypeScript - Tipagem estática completa

🧪 Pronto para testes - Arquitetura testável com mocks

---

### 🚀 Quick Start
Pré-requisitos

- Node.js 20.x ou superior

- PostgreSQL 15 ou superior

- npm ou yarn

### Instalação:

#### 1. Clone o repositório

```sh
git clone https://github.com/duartecgustavo/express-auth-api.git
cd express-auth-api
```

#### 2. Instale as dependências

```sh
npm install
```

#### 3. Configure as variáveis de ambiente

```sh
cp .env.example .env
```

#### 4. Inicie o servidor em desenvolvimento

```sh
npm run dev
```

---

### 📁 Estrutura do Projeto

```
 express-auth-api/
├── src/
│   ├── application/              # Casos de uso e DTOs
│   │   ├── dtos/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── get-users.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── user-id-param.dto.ts
│   │   └── use-cases/
│   │       ├── RegisterUser.useCase.ts
│   │       ├── LoginUser.useCase.ts
│   │       ├── GetUsers.useCase.ts
│   │       ├── GetUserById.useCase.ts
│   │       ├── UpdateUser.useCase.ts
│   │       └── DeleteUser.useCase.ts
│   │
│   ├── domain/                   # Núcleo do negócio
│   │   ├── entities/
│   │   │   └── User.ts
│   │   ├── errors/
│   │   │   ├── RegisterErrors.errors.ts
│   │   │   └── UserError.errors.ts
│   │   ├── repositories/
│   │   │   ├── IUser.repository.ts          # Interface
│   │   │   └── TypeORMUser.repository.ts    # Implementação
│   │   └── services/
│   │       ├── PasswordService.service.ts
│   │       ├── EmailService.service.ts
│   │       ├── TokenService.service.ts
│   │       └── MailService.service.ts
│   │
│   ├── controllers/              # Camada HTTP
│   │   ├── AuthController.controller.ts
│   │   └── dependency-injection-auth.di.ts  # Container de DI
│   │
│   ├── middlewares/              # Interceptadores
│   │   ├── auth.ts
│   │   ├── validateBody.middleware.ts
│   │   ├── validateQuery.middleware.ts
│   │   └── validateParams.middleware.ts
│   │
│   ├── routes/                   # Definição de endpoints
│   │   ├── Auth.routes.ts
│   │   └── Users.routes.ts
│   │
│   ├── app.ts                    # Configuração do Express
│   ├── data-source.ts            # Configuração do TypeORM
│   └── server.ts                 # Entry point
│
├── dist/                         # Build de produção
├── node_modules/                 # Dependências
├── .env.example                  # Exemplo de variáveis de ambiente
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

### 🔄 Arquitetura e Fluxo de Dados

#### Camadas da Aplicação

```
┌─────────────────────────────────────────────────────────┐
│                   HTTP Request                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Routes                                                 │
│  - Define endpoints (GET, POST, PATCH, DELETE)          │
│  - Aplica middlewares (auth, validação)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Middlewares                                            │
│  - Validação de entrada (DTOs)                          │
│  - Autenticação JWT                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Controllers                                            │
│  - Recebe Request/Response                              │
│  - Chama Use Cases                                      │
│  - Formata resposta HTTP                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Use Cases (Application Layer)                          │
│  - Orquestra a lógica de negócio                        │
│  - Independente de frameworks                           │
│  - Chama Repositories e Services                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Domain Layer                                           │
│  - Repositories: Acesso a dados                         │
│  - Services: Lógica reutilizável (hash, email, JWT)     │
│  - Entities: Modelos do banco                           │
│  - Errors: Exceptions customizadas                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Database (PostgreSQL via TypeORM)                      │
└─────────────────────────────────────────────────────────┘
```

---

### 🔒 Segurança
#### Implementações de Segurança

✅ Helmet - Headers de segurança HTTP

✅ CORS - Controle de origens permitidas

✅ JWT - Tokens stateless para autenticação

✅ Bcrypt - Hash de senhas com salt

✅ Validação forte de senha - Maiúsculas, minúsculas, números e símbolos

✅ Rate Limiting - Proteção contra brute force (recomendado adicionar)

✅ Sanitização de entrada - Validação com class-validator

#### Validação de Senha
A senha deve conter:

- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial (!@#$%^&*...)

---

### 📦 Tecnologias Utilizadas
#### Core

- Node.js - Runtime JavaScript
- TypeScript 5.9.3 - Superset tipado do JavaScript
- Express 5.1.0 - Framework web minimalista

#### Database

- TypeORM 0.3.27 - ORM TypeScript
- PostgreSQL - Banco de dados relacional
- pg 8.16.3 - Driver PostgreSQL para Node.js

#### Segurança

- jsonwebtoken 8.5.1 - Geração e validação de JWT
- bcryptjs 3.0.3 - Hash de senhas
- helmet 8.1.0 - Headers de segurança HTTP
- cors 2.8.5 - Controle de CORS

#### Validação

- class-validator 0.14.2 - Validação declarativa com decorators
- class-transformer 0.5.1 - Transformação de objetos

#### Desenvolvimento

- ts-node 10.9.2 - Execução TypeScript em Node.js
- nodemon 3.1.10 - Hot reload para desenvolvimento
- dotenv 17.2.3 - Gerenciamento de variáveis de ambiente

---

#### 🙏 Agradecimentos
> Este projeto foi desenvolvido como um boilerplate reutilizável, aplicando as melhores práticas de:

- Clean Architecture (Uncle Bob)
- SOLID Principles
- Domain-Driven Design (DDD)
- Dependency Injection
- Test-Driven Development (TDD - a implementar)

> Agradecimentos especiais à comunidade open-source e aos criadores das tecnologias utilizadas.

#### 📚 Recursos Úteis

- Clean Architecture
- SOLID Principles
- TypeORM Documentation
- Express.js Best Practices
- JWT Best Practices
- TypeScript Handbook

⭐ Se este projeto foi útil, considere dar uma estrela!
Feito com ❤️, ☕ e TypeScript
