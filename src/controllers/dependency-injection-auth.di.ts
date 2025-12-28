import { LoginUserUC } from "../application/use-cases/LoginUser.useCase";
import { RegisterUserUC } from "../application/use-cases/RegisterUser.useCase";
import { UserController } from "./AuthController.controller";
import { MailService } from "../domain/services/MailService.service";
import { PasswordService } from "../domain/services/PasswordService.service";
import { TokenService } from "../domain/services/TokenService.service";
import { TypeORMUserRepository } from "../domain/repositories/TypeORMUser.repository";

// Repository
const userRepository = new TypeORMUserRepository();

// Services
const passwordService = new PasswordService();
const mailService = new MailService();
const tokenService = new TokenService();

// Use Cases
const registerUserUC = new RegisterUserUC(
  userRepository,
  passwordService,
  mailService
);

const loginUserUC = new LoginUserUC(
  userRepository,
  passwordService,
  mailService,
  tokenService
);

export const authController = new UserController(registerUserUC, loginUserUC);
