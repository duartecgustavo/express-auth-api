import { RegisterUserDto } from "../../../../application/dtos/auth/register.dto";
import { RegisterUserUC } from "../../../../application/use-cases/auth/RegisterUser.useCase";
import { User } from "../../../../domain/entities/User.entity";
import {
  EmailAlreadyInUseError,
  WeakPasswordError,
} from "../../../../domain/errors/auth.errors";
import { DIUser } from "../../../../domain/repositories/IUser";
import { MailService } from "../../../../domain/services/Email.service";
import { PasswordService } from "../../../../domain/services/Password.service";
import { PasswordErrorCode } from "../../../../domain/types/password.types";

describe("RegisterUserUseCase class", () => {
  let registerUserUC: RegisterUserUC;
  let mockUserRepository: jest.Mocked<DIUser>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockEmailService: jest.Mocked<MailService>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<DIUser>;

    mockPasswordService = {
      hash: jest.fn(),
      compare: jest.fn(),
      validate: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    mockEmailService = {
      normalize: jest.fn(),
      validate: jest.fn(),
    } as unknown as jest.Mocked<MailService>;

    registerUserUC = new RegisterUserUC(
      mockUserRepository,
      mockPasswordService,
      mockEmailService
    );
  });

  describe("when the registration is successfull", () => {
    it("must register a new user", async () => {
      const dto: RegisterUserDto = {
        email: "NOVO@EXEMPLO.COM",
        name: "João Silva",
        password: "SenhaForte@123",
      };

      const normalizedEmail = "novo@exemplo.com";
      const hashedPassword = "hashed-password-123";

      const savedUser: User = {
        id: 1,
        email: normalizedEmail,
        password: hashedPassword,
        name: "João Silva",
        isConfirmed: false,
        createdAt: new Date(),
      };

      mockEmailService.normalize.mockReturnValue(normalizedEmail);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue(hashedPassword);
      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await registerUserUC.execute(dto);

      expect(result).toEqual({
        id: 1,
        email: normalizedEmail,
        name: "João Silva",
        isConfirmed: false,
        createdAt: savedUser.createdAt,
      });

      expect(result).not.toHaveProperty("password");
      expect(mockEmailService.normalize).toHaveBeenCalledWith(
        "NOVO@EXEMPLO.COM"
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        "NOVO@EXEMPLO.COM"
      );
      expect(mockPasswordService.validate).toHaveBeenCalledWith(
        "SenhaForte@123"
      );
      expect(mockPasswordService.hash).toHaveBeenCalledWith("SenhaForte@123");
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: normalizedEmail,
          password: hashedPassword,
          name: "João Silva",
          isConfirmed: false,
        })
      );
    });
    it("must normalize the email before saving", async () => {
      const dto: RegisterUserDto = {
        email: "  USUARIO@EXEMPLO.COM  ",
        password: "SenhaForte@123",
        name: "Teste",
      };

      mockEmailService.normalize.mockReturnValue("usuario@exemplo.com");
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue("hash");
      mockUserRepository.save.mockResolvedValue({
        id: 1,
        email: "usuario@exemplo.com",
        password: "hashed",
        name: "Teste",
        isConfirmed: false,
      } as User);

      await registerUserUC.execute(dto);

      expect(mockEmailService.normalize).toHaveBeenCalledWith(
        "  USUARIO@EXEMPLO.COM  "
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "usuario@exemplo.com",
        })
      );
    });
    it("must trim in name before saving", async () => {
      const dto: RegisterUserDto = {
        email: "test@test.com",
        password: "SenhaForte@123",
        name: "   Nome Com Espaços   ",
      };

      mockEmailService.normalize.mockReturnValue("test@test.com");
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue("hashed");
      mockUserRepository.save.mockResolvedValue({
        id: 1,
        name: "Nome Com Espaços",
      } as User);

      await registerUserUC.execute(dto);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Nome Com Espaços",
        })
      );
    });
    it("must save the user with isConfirmed = false", async () => {
      const dto: RegisterUserDto = {
        email: "test@test.com",
        password: "SenhaForte@123",
        name: "Teste",
      };

      mockEmailService.normalize.mockReturnValue("test@test.com");
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue("hashed");
      mockUserRepository.save.mockResolvedValue({
        id: 1,
        isConfirmed: false,
      } as User);

      await registerUserUC.execute(dto);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isConfirmed: false,
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
      };

      const existingUser: User = {
        id: 999,
        email: "existente@exemplo.com",
        password: "old-hash",
        name: "Usuário Existente",
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
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
    describe("when the password is weak", () => {
      it("deve lançar WeakPasswordError com lista de erros", async () => {
        const dto: RegisterUserDto = {
          email: "novo@exemplo.com",
          password: "123",
          name: "Teste",
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
        expect(mockUserRepository.save).not.toHaveBeenCalled();
      });
    });
  });
  describe("execution order of methods", () => {
    it("should execute methods in the correct order: normalize → findByEmail → validate → hash → save", async () => {
      const dto: RegisterUserDto = {
        email: "test@test.com",
        password: "SenhaForte@123",
        name: "Teste",
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

      mockUserRepository.save.mockImplementation(async (user) => {
        callOrder.push("save");
        return { ...user, id: 1 } as User;
      });

      await registerUserUC.execute(dto);

      expect(callOrder).toEqual([
        "normalize",
        "findByEmail",
        "validate",
        "hash",
        "save",
      ]);
    });
  });
  describe("security", () => {
    it("must never return the password in the result", async () => {
      const dto: RegisterUserDto = {
        email: "test@test.com",
        password: "SenhaForte@123",
        name: "Teste",
      };

      mockEmailService.normalize.mockReturnValue("test@test.com");
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue("super-secret-hash");
      mockUserRepository.save.mockResolvedValue({
        id: 1,
        email: "test@test.com",
        password: "super-secret-hash",
        name: "Teste",
        isConfirmed: false,
      } as User);

      const result = await registerUserUC.execute(dto);

      expect(result).not.toHaveProperty("password");
      expect(Object.keys(result)).not.toContain("password");
    });

    it("must save the password hashed, never in plain text", async () => {
      const dto: RegisterUserDto = {
        email: "test@test.com",
        password: "MinhaSenha@123",
        name: "Teste",
      };

      mockEmailService.normalize.mockReturnValue("test@test.com");
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue("$2b$10$hashed...");
      mockUserRepository.save.mockResolvedValue({ id: 1 } as User);

      await registerUserUC.execute(dto);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: "$2b$10$hashed...",
        })
      );

      expect(mockUserRepository.save).not.toHaveBeenCalledWith(
        expect.objectContaining({
          password: "MinhaSenha@123",
        })
      );
    });
  });
});
