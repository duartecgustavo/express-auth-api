import { UpdateUserDto } from "../../../../application/dtos/users/update-user.dto";
import { UpdateUserUC } from "../../../../application/use-cases/users/UpdateUserById.useCase";
import { User } from "../../../../domain/entities/User.entity";
import { DIUser } from "../../../../domain/repositories/IUser";
import { MailService } from "../../../../domain/services/Email.service";
import { PasswordService } from "../../../../domain/services/Password.service";

describe("UpdateUserUseCase class", () => {
  let updateUserUC: UpdateUserUC;
  let mockUserRepository: jest.Mocked<DIUser>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockMailService: jest.Mocked<MailService>;

  const mockExistingUser: User = {
    id: 1,
    email: "original@exemplo.com",
    password: "hashed-password",
    name: "Nome Original",
    isConfirmed: false,
    createdAt: new Date("2024-01-01"),
  };

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
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
  });
});
