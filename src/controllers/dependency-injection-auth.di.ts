import { DeleteUserUC } from "../application/use-cases/DeleteUser.useCase";
import { GetUserByIdUC } from "../application/use-cases/GetUserById.useCase";
import { GetUsersUC } from "../application/use-cases/GetUsers.useCase";
import { LoginUserUC } from "../application/use-cases/LoginUser.useCase";
import { RegisterUserUC } from "../application/use-cases/RegisterUser.useCase";
import { UpdateUserUC } from "../application/use-cases/UpdateUserById.useCase";
import { TypeORMUserRepository } from "../domain/repositories/TypeORMUser.repository";
import { MailService } from "../domain/services/MailService.service";
import { PasswordService } from "../domain/services/PasswordService.service";
import { TokenService } from "../domain/services/TokenService.service";
import { UserController } from "./AuthController.controller";

const userRepository = new TypeORMUserRepository();

const passwordService = new PasswordService();
const mailService = new MailService();
const tokenService = new TokenService();

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

const getUsersUC = new GetUsersUC(userRepository);
const getUserByIdUC = new GetUserByIdUC(userRepository);
const updateUserUC = new UpdateUserUC(
  userRepository,
  passwordService,
  mailService
);
const deleteUserByIdUC = new DeleteUserUC(userRepository);

export const authController = new UserController(
  registerUserUC,
  loginUserUC,
  getUsersUC,
  getUserByIdUC,
  updateUserUC,
  deleteUserByIdUC
);
