import { RegisterUserDto } from "../../../../application/dtos/auth/register.dto";
import { RegisterUserUC } from "../../../../application/use-cases/auth/RegisterUser.useCase";
import { User } from "../../../../domain/entities/User.entity";
import {
  EmailAlreadyInUseError,
  WeakPasswordError,
} from "../../../../domain/errors/auth.errors";
import { DIUser } from "../../../../domain/repositories/IUser";
import { IPendingRegistrationRepository } from "../../../../domain/repositories/IPendingRegistration";
import { IVerificationService } from "../../../../domain/services/Verification.service";
import { MailService } from "../../../../domain/services/Email.service";
import { PasswordService } from "../../../../domain/services/Password.service";
import { PasswordErrorCode } from "../../../../domain/types/password.types";

describe("RegisterUserUseCase class", () => {
  let registerUserUC: RegisterUserUC;
  let mockUserRepository: jest.Mocked<DIUser>;
  let mockPendingRepository: jest.Mocked<IPendingRegistrationRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockEmailService: jest.Mocked<MailService>;
  let mockVerificationService: jest.Mocked<IVerificationService>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<DIUser>;

    mockPendingRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      deleteByEmail: jest.fn(),
    } as jest.Mocked<IPendingRegistrationRepository>;

    mockPasswordService = {
      hash: jest.fn(),
      compare: jest.fn(),
      validate: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    mockEmailService = {
      normalize: jest.fn(),
      validate: jest.fn(),
    } as unknown as jest.Mocked<MailService>;

    mockVerificationService = {
      sendCode: jest.fn(),
      verifyCode: jest.fn(),
    } as jest.Mocked<IVerificationService>;

    registerUserUC = new RegisterUserUC(
      mockUserRepository,
      mockPendingRepository,
      mockPasswordService,
      mockEmailService,
      mockVerificationService
    );
  });

  describe("when the registration is successfull", () => {
    it("must save pending and send verification code", async () => {
      const dto: RegisterUserDto = {
        email: "NOVO@EXEMPLO.COM",
        name: "João Silva",
        nickname: "joaosilva",
        password: "SenhaForte@123",
      };

      const normalizedEmail = "novo@exemplo.com";
      const hashedPassword = "hashed-password-123";

      mockEmailService.normalize.mockReturnValue(normalizedEmail);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue(hashedPassword);
      mockPendingRepository.save.mockResolvedValue({} as any);
      mockVerificationService.sendCode.mockResolvedValue(undefined);

      const result = await registerUserUC.execute(dto);

      expect(result).toEqual({
        message:
          "Cadastro iniciado. Verifique seu email e confirme o código para efetivar o cadastro.",
        email: normalizedEmail,
      });
      expect(mockEmailService.normalize).toHaveBeenCalledWith(
        "NOVO@EXEMPLO.COM"
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        normalizedEmail
      );
      expect(mockPasswordService.validate).toHaveBeenCalledWith(
        "SenhaForte@123"
      );
      expect(mockPasswordService.hash).toHaveBeenCalledWith("SenhaForte@123");
      expect(mockPendingRepository.save).toHaveBeenCalledTimes(1);
      expect(mockPendingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: normalizedEmail,
          password: hashedPassword,
          name: "João Silva",
          nickname: "joaosilva",
          linkedin: null,
        })
      );
      expect(mockVerificationService.sendCode).toHaveBeenCalledWith(
        normalizedEmail
      );
    });

    it("must normalize the email before saving", async () => {
      const dto: RegisterUserDto = {
        email: "  USUARIO@EXEMPLO.COM  ",
        password: "SenhaForte@123",
        name: "Teste",
        nickname: "teste",
      };

      mockEmailService.normalize.mockReturnValue("usuario@exemplo.com");
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue("hash");
      mockPendingRepository.save.mockResolvedValue({} as any);
      mockVerificationService.sendCode.mockResolvedValue(undefined);

      await registerUserUC.execute(dto);

      expect(mockEmailService.normalize).toHaveBeenCalledWith(
        "  USUARIO@EXEMPLO.COM  "
      );
      expect(mockPendingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "usuario@exemplo.com",
        })
      );
    });

    it("must trim name and nickname before saving", async () => {
      const dto: RegisterUserDto = {
        email: "test@test.com",
        password: "SenhaForte@123",
        name: "   Nome Com Espaços   ",
        nickname: "nick",
      };

      mockEmailService.normalize.mockReturnValue("test@test.com");
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue("hashed");
      mockPendingRepository.save.mockResolvedValue({} as any);
      mockVerificationService.sendCode.mockResolvedValue(undefined);

      await registerUserUC.execute(dto);

      expect(mockPendingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Nome Com Espaços",
          nickname: "nick",
        })
      );
    });
  });

  describe("when the email has already been used", () => {
    it("must throw EmailAlreadyInUseError", async () => {
      const dto: RegisterUserDto = {
        email: "existente@exemplo.com",
        password: "SenhaForte@123",
        name: "Teste",
        nickname: "teste",
      };

      const existingUser: User = {
        id: 999,
        code: "uuid-existing",
        email: "existente@exemplo.com",
        password: "old-hash",
        name: "Usuário Existente",
        nickname: "existente",
        linkedin: null,
        isConfirmed: true,
        createdAt: new Date(),
      };

      mockEmailService.normalize.mockReturnValue("existente@exemplo.com");
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(registerUserUC.execute(dto)).rejects.toThrow(
        EmailAlreadyInUseError
      );

      expect(mockPasswordService.validate).not.toHaveBeenCalled();
      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockPendingRepository.save).not.toHaveBeenCalled();
      expect(mockVerificationService.sendCode).not.toHaveBeenCalled();
    });
  });

  describe("when the password is weak", () => {
    it("deve lançar WeakPasswordError com lista de erros", async () => {
      const dto: RegisterUserDto = {
        email: "novo@exemplo.com",
        password: "123",
        name: "Teste",
        nickname: "teste",
      };

      const passwordErrors = [
        {
          code: PasswordErrorCode.MIN_LENGTH,
          message: "Senha muito curta",
        },
        {
          code: PasswordErrorCode.UPPERCASE_REQUIRED,
          message: "Falta maiúscula",
        },
      ];

      mockEmailService.normalize.mockReturnValue("novo@exemplo.com");
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({
        isValid: false,
        errors: passwordErrors,
      });

      await expect(registerUserUC.execute(dto)).rejects.toThrow(
        WeakPasswordError
      );

      try {
        await registerUserUC.execute(dto);
      } catch (error) {
        if (error instanceof WeakPasswordError) {
          expect(error.errors).toEqual(passwordErrors);
        }
      }

      expect(mockPasswordService.hash).not.toHaveBeenCalled();
      expect(mockPendingRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("execution order of methods", () => {
    it("should execute methods in the correct order", async () => {
      const dto: RegisterUserDto = {
        email: "test@test.com",
        password: "SenhaForte@123",
        name: "Teste",
        nickname: "teste",
      };

      const callOrder: string[] = [];

      mockEmailService.normalize.mockImplementation((email) => {
        callOrder.push("normalize");
        return email.toLowerCase();
      });

      mockUserRepository.findByEmail.mockImplementation(async () => {
        callOrder.push("findByEmail");
        return null;
      });

      mockPasswordService.validate.mockImplementation(() => {
        callOrder.push("validate");
        return { isValid: true, errors: [] };
      });

      mockPasswordService.hash.mockImplementation(async () => {
        callOrder.push("hash");
        return "hashed";
      });

      mockPendingRepository.save.mockImplementation(async () => {
        callOrder.push("save");
        return {} as any;
      });

      mockVerificationService.sendCode.mockImplementation(async () => {
        callOrder.push("sendCode");
      });

      await registerUserUC.execute(dto);

      expect(callOrder).toEqual([
        "normalize",
        "findByEmail",
        "validate",
        "hash",
        "save",
        "sendCode",
      ]);
    });
  });

  describe("security", () => {
    it("must save the password hashed, never in plain text", async () => {
      const dto: RegisterUserDto = {
        email: "test@test.com",
        password: "MinhaSenha@123",
        name: "Teste",
        nickname: "teste",
      };

      mockEmailService.normalize.mockReturnValue("test@test.com");
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue("$2b$10$hashed...");
      mockPendingRepository.save.mockResolvedValue({} as any);
      mockVerificationService.sendCode.mockResolvedValue(undefined);

      await registerUserUC.execute(dto);

      expect(mockPendingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: "$2b$10$hashed...",
        })
      );

      expect(mockPendingRepository.save).not.toHaveBeenCalledWith(
        expect.objectContaining({
          password: "MinhaSenha@123",
        })
      );
    });
  });
});
