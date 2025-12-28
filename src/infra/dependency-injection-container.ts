import { RegisterUserUC } from "../controllers/application/use-cases/RegisterUser.useCase";
import { UserController } from "../controllers/userController";
import { MailService } from "../domain/services/MailService";
import { PasswordService } from "../domain/services/PasswordService";
import { TypeORMUserRepository } from "../repositories/TypeORMUserRepository";

// Repository
const userRepository = new TypeORMUserRepository();

// Services
const passwordService = new PasswordService();
const mailService = new MailService();

// Use Cases
const registerUserUC = new RegisterUserUC(
  userRepository,
  passwordService,
  mailService
);

export const userController = new UserController(registerUserUC);
