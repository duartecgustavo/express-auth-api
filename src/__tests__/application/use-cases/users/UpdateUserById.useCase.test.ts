import { UpdateUserDto } from "../../../../application/dtos/users/update-user.dto";
import { UpdateUserUC } from "../../../../application/use-cases/users/UpdateUserById.useCase";
import { User } from "../../../../domain/entities/User.entity";
import {
  EmailAlreadyInUseError,
  WeakPasswordError,
} from "../../../../domain/errors/auth.errors";
import {
  NoFieldsToUpdateError,
  UserNotFoundError,
} from "../../../../domain/errors/user.errors";
import { DIUser } from "../../../../domain/repositories/IUser";
import { MailService } from "../../../../domain/services/Email.service";
import { PasswordService } from "../../../../domain/services/Password.service";
import { PasswordErrorCode } from "../../../../domain/types/password.types";

describe("UpdateUserUseCase class", () => {
  let updateUserUC: UpdateUserUC;
  let mockUserRepository: jest.Mocked<DIUser>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockMailService: jest.Mocked<MailService>;

  const mockExistingUser: User = {
    id: 1,
    code: "user-code-123",
    email: "original@exemplo.com",
    password: "hashed-password",
    name: "Nome Original",
    nickname: "original",
    linkedin: null,
    isConfirmed: false,
    createdAt: new Date("2024-01-01"),
  };

  const makeUser = (): User => ({
    id: 1,
    code: "user-code-123",
    email: "original@exemplo.com",
    password: "hashed-password",
    name: "Nome Original",
    nickname: "original",
    linkedin: null,
    isConfirmed: false,
    createdAt: new Date("2024-01-01"),
  });

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByCode: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    } as jest.Mocked<DIUser>;

    mockPasswordService = {
      hash: jest.fn(),
      validate: jest.fn(),
      compare: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    mockMailService = {
      normalize: jest.fn(),
      validate: jest.fn(),
    } as unknown as jest.Mocked<MailService>;

    updateUserUC = new UpdateUserUC(
      mockUserRepository,
      mockPasswordService,
      mockMailService
    );
  });

  describe("when the name is updated", () => {
    it("must update only the name", async () => {
      const userId = "1";
      const dto: UpdateUserDto = {
        name: "  Novo Nome  ",
      };

      mockUserRepository.findById.mockResolvedValue(mockExistingUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockExistingUser,
        name: "Novo Nome",
      });

      const result = await updateUserUC.execute(userId, dto);

      expect(result.name).toBe("Novo Nome");
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Novo Nome" })
      );
    });
    it("must trim whitespace from the name", async () => {
      const userId = "1";
      const dto: UpdateUserDto = {
        name: "  Novo Nome  ",
      };

      mockUserRepository.findById.mockResolvedValue(mockExistingUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockExistingUser,
        name: "Novo Nome",
      });

      const result = await updateUserUC.execute(userId, dto);

      expect(result.name).toBe("Novo Nome");
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Novo Nome" })
      );
    });
  });
  describe("when the email is updated", () => {
    it("must update only the email", async () => {
      const userId = "1";
      const dto: UpdateUserDto = { email: "  NOVO@EXEMPLO.COM  " };

      mockMailService.normalize.mockReturnValue("novo@exemplo.com");
      mockUserRepository.findById.mockResolvedValue(mockExistingUser);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue({
        ...mockExistingUser,
        email: "novo@exemplo.com",
      });

      const result = await updateUserUC.execute(userId, dto);

      expect(result.email).toBe("novo@exemplo.com");
      expect(mockMailService.normalize).toHaveBeenCalledWith(
        "  NOVO@EXEMPLO.COM  "
      );
    });
    it("must not verify duplication if email has not changed", async () => {
      const userId = "1";
      const dto: UpdateUserDto = { email: "ORIGINAL@EXEMPLO.COM" };

      mockMailService.normalize.mockReturnValue("original@exemplo.com");
      mockUserRepository.findById.mockResolvedValue(makeUser());
      mockUserRepository.save.mockResolvedValue(mockExistingUser);

      await updateUserUC.execute(userId, dto);

      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });
  });
  describe("when the password is updated", () => {
    it("must validate and hash password", async () => {
      const userId = "1";
      const dto: UpdateUserDto = { password: "NovaSenha123" };

      mockUserRepository.findById.mockResolvedValue(mockExistingUser);
      mockPasswordService.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue("new-hash");
      mockUserRepository.save.mockResolvedValue({
        ...mockExistingUser,
        password: "new-hash",
      });

      await updateUserUC.execute(userId, dto);

      expect(mockPasswordService.validate).toHaveBeenCalledWith("NovaSenha123");
      expect(mockPasswordService.hash).toHaveBeenCalledWith("NovaSenha123");
    });
  });
  describe("when the update is confirmed", () => {
    it("must update isConfirmed to true", async () => {
      const userId = "1";
      const dto: UpdateUserDto = { isConfirmed: true };

      mockUserRepository.findById.mockResolvedValue(mockExistingUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockExistingUser,
        isConfirmed: true,
      });

      const result = await updateUserUC.execute(userId, dto);

      expect(result.isConfirmed).toBe(true);
    });
  });
  describe("when updating multi fields", () => {
    it("must update all the fields", async () => {
      const userId = "1";
      const dto: UpdateUserDto = {
        name: "Nome Completo",
        email: "novo@exemplo.com",
        password: "Nova@123",
        isConfirmed: true,
      };

      mockMailService.normalize.mockReturnValue("novo@exemplo.com");
      mockUserRepository.findById.mockResolvedValue(mockExistingUser);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.validate.mockReturnValue({
        isValid: true,
        errors: [],
      });
      mockPasswordService.hash.mockResolvedValue("hash");
      mockUserRepository.save.mockResolvedValue({
        ...mockExistingUser,
        name: "Nome Completo",
        email: "novo@exemplo.com",
        password: "hash",
        isConfirmed: true,
      });

      const result = await updateUserUC.execute(userId, dto);

      expect(result.name).toBe("Nome Completo");
      expect(result.email).toBe("novo@exemplo.com");
      expect(result.isConfirmed).toBe(true);
      expect(result).not.toHaveProperty("password");
    });
  });
  describe("when no fields are provided", () => {
    it("must throw NoFieldsToUpdateError", async () => {
      const userId = "1";
      const dto: UpdateUserDto = {};

      await expect(updateUserUC.execute(userId, dto)).rejects.toThrow(
        NoFieldsToUpdateError
      );

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });
  });
  describe("when the user does not exists", () => {
    it("must throw UserNotFoundError", async () => {
      const userId = "999";
      const dto: UpdateUserDto = { name: "Nome" };

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(updateUserUC.execute(userId, dto)).rejects.toThrow(
        UserNotFoundError
      );
    });
  });
  describe("when the email is already in use", () => {
    it("must throw EmailAlreadyInUseError", async () => {
      const userId = "1";
      const dto: UpdateUserDto = { email: "outro@exemplo.com" };

      const otherUser = { ...mockExistingUser, id: 2 };

      mockMailService.normalize.mockReturnValue("outro@exemplo.com");
      mockUserRepository.findById.mockResolvedValue(mockExistingUser);
      mockUserRepository.findByEmail.mockResolvedValue(otherUser);

      await expect(updateUserUC.execute(userId, dto)).rejects.toThrow(
        EmailAlreadyInUseError
      );
    });
  });

  describe("when the password is weak", () => {
    it("must throw WeakPasswordError", async () => {
      const userId = "1";
      const dto: UpdateUserDto = { password: "123" };

      mockUserRepository.findById.mockResolvedValue(mockExistingUser);
      mockPasswordService.validate.mockReturnValue({
        isValid: false,
        errors: [
          {
            code: PasswordErrorCode.UPPERCASE_REQUIRED,
            message: "Muito curta",
          },
        ],
      });

      await expect(updateUserUC.execute(userId, dto)).rejects.toThrow(
        WeakPasswordError
      );

      expect(mockPasswordService.hash).not.toHaveBeenCalled();
    });
  });

  describe("security", () => {
    it("must never return the password", async () => {
      const userId = "1";
      const dto: UpdateUserDto = { name: "Nome" };

      mockUserRepository.findById.mockResolvedValue(mockExistingUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockExistingUser,
        password: "secret",
      });

      const result = await updateUserUC.execute(userId, dto);

      expect(result).not.toHaveProperty("password");
    });
  });
});
