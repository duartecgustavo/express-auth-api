import { LoginUserDto } from "../../../../application/dtos/auth/login.dto";
import { LoginUserUC } from "../../../../application/use-cases/auth/LoginUser.useCase";
import { User } from "../../../../domain/entities/User.entity";
import { InvalidCredentialsError } from "../../../../domain/errors/user.errors";
import { DIUser } from "../../../../domain/repositories/IUser";
import { MailService } from "../../../../domain/services/Email.service";
import { PasswordService } from "../../../../domain/services/Password.service";
import { TokenService } from "../../../../domain/services/Token.service";
import {
  loginUserUC,
  passwordService,
} from "../../../../infrastructure/di/dependency-injection-auth.di";

describe("LoginUseCase class", () => {
  let loginUserUC: LoginUserUC;
  let mockUserRepository: jest.Mocked<DIUser>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockMailService: jest.Mocked<MailService>;
  let mockTokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    } as jest.Mocked<DIUser>;

    mockPasswordService = {
      hash: jest.fn(),
      compare: jest.fn(),
      validate: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    mockMailService = {
      normalize: jest.fn(),
      validate: jest.fn(),
    } as unknown as jest.Mocked<MailService>;

    mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    loginUserUC = new LoginUserUC(
      mockUserRepository,
      mockPasswordService,
      mockMailService,
      mockTokenService
    );
  });

  describe("when the login is successfull", () => {
    it("must return the tokens and the user data", async () => {
      const dto: LoginUserDto = {
        email: "USUARIO@EXEMPLO.COM",
        password: "SenhaCorreta@123",
      };

      const mockUser: User = {
        id: 1,
        email: "usuario@exemplo.com",
        password: "$2b$10$hashedPassword",
        name: "João Silva",
        isConfirmed: true,
        createdAt: new Date(),
      };

      mockMailService.normalize.mockReturnValue("usuario@exemplo.com");
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue("access-token-123");
      mockTokenService.generateRefreshToken.mockReturnValue(
        "refresh-token-456"
      );

      const result = await loginUserUC.execute(dto);

      expect(result).toEqual({
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        expiresIn: 900,
        user: {
          id: "1",
          email: "usuario@exemplo.com",
          name: "João Silva",
        },
      });

      expect(result.user).not.toHaveProperty("password");
    });
    it("must normalize the email before searching", async () => {
      const dto: LoginUserDto = {
        email: "  TESTE@TESTE.COM  ",
        password: "Senha@123",
      };

      mockMailService.normalize.mockReturnValue("teste@teste.com");
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        password: "hashed",
      } as User);
      mockPasswordService.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue("access");
      mockTokenService.generateRefreshToken.mockReturnValue("refresh");

      await loginUserUC.execute(dto);

      expect(mockMailService.normalize).toHaveBeenCalledWith(
        "  TESTE@TESTE.COM  "
      );
    });
    it("must compare the provided password with the stored hash", async () => {
      const dto: LoginUserDto = {
        email: "user@test.com",
        password: "MinhaSenha@123",
      };

      const mockUser: User = {
        id: 1,
        email: "user@test.com",
        password: "$2b$10$storedHashValue",
        name: "User",
      } as User;

      mockMailService.normalize.mockReturnValue("user@test.com");
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue("access");
      mockTokenService.generateRefreshToken.mockReturnValue("refresh");

      await loginUserUC.execute(dto);

      expect(mockPasswordService.compare).toHaveBeenCalledWith(
        "MinhaSenha@123",
        "$2b$10$storedHashValue"
      );
    });
    it("must generate tokens using the user ID and email", async () => {
      const dto: LoginUserDto = {
        email: "user@test.com",
        password: "Senha@123",
      };

      const mockUser: User = {
        id: 42,
        email: "user@test.com",
        password: "hashed",
        name: "Test User",
      } as User;

      mockMailService.normalize.mockReturnValue("user@test.com");
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue("access");
      mockTokenService.generateRefreshToken.mockReturnValue("refresh");

      await loginUserUC.execute(dto);

      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
        "42",
        "user@test.com"
      );
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith(
        "42",
        "user@test.com"
      );
    });
    it("must return expiresIn as 900 seconds (15 minutes)", async () => {
      const dto: LoginUserDto = {
        email: "user@test.com",
        password: "Senha@123",
      };

      mockMailService.normalize.mockReturnValue("user@test.com");
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        password: "hashed",
      } as User);
      mockPasswordService.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue("access");
      mockTokenService.generateRefreshToken.mockReturnValue("refresh");

      const result = await loginUserUC.execute(dto);

      expect(result.expiresIn).toEqual(900);
    });
  });
  describe("when the user is not found", () => {
    it("must throw InvalidCredentialsError", async () => {
      const dto: LoginUserDto = {
        email: "naoexiste@exemplo.com",
        password: "QualquerSenha@123",
      };

      mockMailService.normalize.mockReturnValue("naoexiste@exemplo.com");
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(loginUserUC.execute(dto)).rejects.toThrow(
        InvalidCredentialsError
      );

      expect(mockPasswordService.compare).not.toHaveBeenCalled();
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });
  });
  describe("when the password is wrong", () => {
    it("must throw InvalidCredentialsError", async () => {
      const dto: LoginUserDto = {
        email: "naoexiste@exemplo.com",
        password: "QualquerSenha@123",
      };

      const mockUser: User = {
        id: 1,
        email: "usuario@exemplo.com",
        password: "$2b$10$hashedPassword",
        name: "João Silva",
      } as User;

      mockMailService.normalize.mockReturnValue("naoexiste@exemplo.com");
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(loginUserUC.execute(dto)).rejects.toThrow(
        InvalidCredentialsError
      );

      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
      expect(mockTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });
  });
  describe("security", () => {
    it("must never reveal whether the email or password is wrong", async () => {
      mockMailService.normalize.mockReturnValue("naoexiste@test.com");
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const error1 = loginUserUC.execute({
        email: "naoexiste@test.com",
        password: "Senha@123",
      });

      mockMailService.normalize.mockReturnValue("existe@test.com");
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        password: "hashed",
      } as User);
      mockPasswordService.compare.mockResolvedValue(false);

      const error2 = loginUserUC.execute({
        email: "existe@test.com",
        password: "SenhaErrada@123",
      });

      await expect(error1).rejects.toThrow(InvalidCredentialsError);
      await expect(error2).rejects.toThrow(InvalidCredentialsError);
    });

    it("must never return the password", async () => {
      const dto: LoginUserDto = {
        email: "user@test.com",
        password: "Senha@123",
      };

      mockMailService.normalize.mockReturnValue("user@test.com");
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: "user@test.com",
        password: "super-secret-hash-abc123",
        name: "User",
      } as User);
      mockPasswordService.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue("access");
      mockTokenService.generateRefreshToken.mockReturnValue("refresh");

      const result = await loginUserUC.execute(dto);

      expect(result.user).not.toHaveProperty("password");
      expect(JSON.stringify(result)).not.toContain("super-secret-hash");
    });

    it("must convert numeric ID to a string in tokens", async () => {
      const dto: LoginUserDto = {
        email: "user@test.com",
        password: "Senha@123",
      };

      mockMailService.normalize.mockReturnValue("user@test.com");
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 999,
        email: "user@test.com",
        password: "hashed",
        name: "User",
      } as User);
      mockPasswordService.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue("access");
      mockTokenService.generateRefreshToken.mockReturnValue("refresh");

      await loginUserUC.execute(dto);

      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
        "999",
        "user@test.com"
      );
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith(
        "999",
        "user@test.com"
      );
    });
  });
});
