import { ConfirmRegistrationUC } from "../../application/use-cases/auth/ConfirmRegistration.useCase";
import { LoginUserUC } from "../../application/use-cases/auth/LoginUser.useCase";
import { RegisterUserUC } from "../../application/use-cases/auth/RegisterUser.useCase";
import { DeleteUserUC } from "../../application/use-cases/users/DeleteUser.useCase";
import { GetUserByIdUC } from "../../application/use-cases/users/GetUserById.useCase";
import { GetUsersUC } from "../../application/use-cases/users/GetUsers.useCase";
import { UpdateUserUC } from "../../application/use-cases/users/UpdateUserById.useCase";
import { MailService } from "../../domain/services/Email.service";
import { PasswordService } from "../../domain/services/Password.service";
import { TokenService } from "../../domain/services/Token.service";
import { IVerificationService } from "../../domain/services/Verification.service";
import { TypeORMPendingRegistrationRepository } from "../database/repositories/TypeORMPendingRegistration.repository";
import { TypeORMUserRepository } from "../database/repositories/TypeORMUser.repository";
import { AuthController } from "../http/controllers/Auth.controller";
import { UserController } from "../http/controllers/User.controller";
import { MockVerificationService } from "../services/MockVerification.service";
import { TwilioVerificationService } from "../services/TwilioVerification.service";

const userRepository = new TypeORMUserRepository();
const pendingRegistrationRepository = new TypeORMPendingRegistrationRepository();

const passwordService = new PasswordService();
const mailService = new MailService();
const tokenService = new TokenService();

const verificationService: IVerificationService =
  process.env.TWILIO_VERIFY_SERVICE_SID
    ? new TwilioVerificationService()
    : new MockVerificationService();

const registerUserUC = new RegisterUserUC(
  userRepository,
  pendingRegistrationRepository,
  passwordService,
  mailService,
  verificationService
);

const confirmRegistrationUC = new ConfirmRegistrationUC(
  userRepository,
  pendingRegistrationRepository,
  verificationService
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

export const authController = new AuthController(
  registerUserUC,
  confirmRegistrationUC,
  loginUserUC
);

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
