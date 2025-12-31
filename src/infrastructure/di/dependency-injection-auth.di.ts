import { LoginUserUC } from "../../application/use-cases/auth/LoginUser.useCase";
import { RegisterUserUC } from "../../application/use-cases/auth/RegisterUser.useCase";
import { DeleteUserUC } from "../../application/use-cases/users/DeleteUser.useCase";
import { GetUserByIdUC } from "../../application/use-cases/users/GetUserById.useCase";
import { GetUsersUC } from "../../application/use-cases/users/GetUsers.useCase";
import { UpdateUserUC } from "../../application/use-cases/users/UpdateUserById.useCase";
import { MailService } from "../../domain/services/Email.service";
import { PasswordService } from "../../domain/services/Password.service";
import { TokenService } from "../../domain/services/Token.service";
import { TypeORMUserRepository } from "../database/repositories/TypeORMUser.repository";
import { AuthController } from "../http/controllers/Auth.controller";
import { UserController } from "../http/controllers/User.controller";

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

const deleteUserUC = new DeleteUserUC(userRepository);

export const authController = new AuthController(registerUserUC, loginUserUC);

export const userController = new UserController(
  getUsersUC,
  getUserByIdUC,
  updateUserUC,
  deleteUserUC
);

export {
  deleteUserUC,
  getUserByIdUC,
  getUsersUC,
  loginUserUC,
  mailService,
  passwordService,
  registerUserUC,
  tokenService,
  updateUserUC,
  userRepository,
};
