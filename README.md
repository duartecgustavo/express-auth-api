# express-auth-api

📋 Princípios SOLID aplicados
PrincípioComo foi aplicadoSRPController só lida com HTTP, UseCase com lógica, Services com regras específicasOCPNovas validações = novos services, sem modificar código existenteLSPQualquer implementação de IUserRepository funciona (TypeORM, Prisma, MongoDB)ISPInterface IUserRepository só tem métodos necessáriosDIPUseCase depende de interface, não de implementação concreta

Vantagens:
✅ Testável (mock de repositórios e services)
✅ Flexível (troca TypeORM por Prisma facilmente)
✅ Escalável (adicionar features sem quebrar código)
✅ SOLID compliant
✅ Production-ready


// ✅ Cada classe com 1 responsabilidade
PasswordService → Validar e hash senha
EmailService → Normalizar email
UserRepository → Persistência
RegisterUserUseCase → Orquestrar o fluxo
UserController → Lidar com HTTP

```

---

## 💡 Recomendação

Para um **boilerplate reutilizável**, recomendo a **arquitetura completa**:

### **Estrutura de pastas:**
```

src/
├── application/
│ ├── dtos/
│ └── use-cases/
├── domain/
│ ├── entities/
│ ├── errors/
│ ├── repositories/ (interfaces)
│ └── services/
├── infrastructure/
│ ├── di/
│ └── repositories/ (implementações)
├── controllers/
├── middlewares/
└── routes/
