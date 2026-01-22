import { GetUserByIdUC } from "../../../../application/use-cases/users/GetUserById.useCase";
import { DIUser } from "../../../../domain/repositories/IUser";
import { User } from "../../../../domain/entities/User.entity";
import { UserNotFoundError } from "../../../../domain/errors/user.errors";

describe("GetUserByIdUseCase class", () => {
  let getUserByIdUC: GetUserByIdUC;
  let mockUserRepository: jest.Mocked<DIUser>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<DIUser>;

    getUserByIdUC = new GetUserByIdUC(mockUserRepository);
  });

  describe("when the user exists", () => {
    it("must return the user without the password", async () => {
      const userId = "1";

      const mockUser: User = {
        id: 1,
        email: "usuario@exemplo.com",
        password: "hashed-password-secret",
        name: "João Silva",
        isConfirmed: true,
        createdAt: new Date("2024-01-01"),
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await getUserByIdUC.execute(userId);

      expect(result).toEqual({
        id: 1,
        email: "usuario@exemplo.com",
        name: "João Silva",
        isConfirmed: true,
        createdAt: mockUser.createdAt,
      });

      expect(result).not.toHaveProperty("password");
    });
    it("must convert userId string to number when searching", async () => {
      const userId = "42";

      const mockUser: User = {
        id: 42,
        email: "test@test.com",
        password: "hashed",
        name: "Test User",
      } as User;

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await getUserByIdUC.execute(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(42);
    });
    it("must work with different IDs", async () => {
      const mockId = ["1", "66", "99"];

      for (const id of mockId) {
        const mockUser: User = {
          id: Number(id),
          email: "user@test.com",
          password: "hashed",
          name: "User",
        } as User;

        mockUserRepository.findById.mockResolvedValue(mockUser);

        const result = await getUserByIdUC.execute(id);

        expect(result.id).toBe(Number(id));
        expect(mockUserRepository.findById).toHaveBeenCalledWith(Number(id));
      }
    });
    it("must return all the fields except the password", async () => {
      const userId = "1";

      const mockUser: User = {
        id: 1,
        email: "complete@test.com",
        password: "hashed",
        name: "Complete User",
        isConfirmed: false,
        createdAt: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await getUserByIdUC.execute(userId);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("isConfirmed");
      expect(result).toHaveProperty("createdAt");

      expect(result).not.toHaveProperty("password");
    });
  });
  describe("when the user does not exist", () => {
    it("must throw UserNotFoundError", async () => {
      const userId = "999";

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(getUserByIdUC.execute(userId)).rejects.toThrow(
        UserNotFoundError
      );
    });
    it("must throw the error with the correct ID in message", async () => {
      const userId = "123";

      mockUserRepository.findById.mockResolvedValue(null);

      try {
        await getUserByIdUC.execute(userId);
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          expect(error.message).toContain("123");
        }
      }
    });
    it("must throw UserNotFoundError for different IDs that do not exist", async () => {
      const nonExistentIds = ["1", "999", "12345"];

      for (const userId of nonExistentIds) {
        mockUserRepository.findById.mockResolvedValue(null);

        await expect(getUserByIdUC.execute(userId)).rejects.toThrow(
          UserNotFoundError
        );
      }
    });
  });
  describe("security", () => {
    it("must guarantee that the password is never exposed", async () => {
      const userId = "1";

      const mockUser: User = {
        id: 1,
        email: "user@test.com",
        password: "THIS-SHOULD-NEVER-BE-RETURNED",
        name: "User",
        isConfirmed: true,
        createdAt: new Date(),
      } as User;

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await getUserByIdUC.execute(userId);

      expect("password" in result).toBe(false);
      expect(Object.keys(result).includes("password")).toBe(false);
    });
  });
  describe("edge cases", () => {
    it("must work with ID as numeric string", async () => {
      const userId = "007";

      mockUserRepository.findById.mockResolvedValue({
        id: 7,
        email: "user@test.com",
        password: "hashed",
        name: "James Bond",
      } as User);

      const result = await getUserByIdUC.execute(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(7);
      expect(result.id).toBe(7);
    });

    it("must call the repository only once", async () => {
      const userId = "1";

      mockUserRepository.findById.mockResolvedValue({
        id: 1,
        password: "hashed",
      } as User);

      await getUserByIdUC.execute(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    });
  });
});
