import { DeleteUserUC } from "../../../../application/use-cases/users/DeleteUser.useCase";
import { DIUser } from "../../../../domain/repositories/IUser";
import { User } from "../../../../domain/entities/User.entity";
import { UserNotFoundError } from "../../../../domain/errors/user.errors";

describe("DeleteUserUseCase class", () => {
  let deleteUserUC: DeleteUserUC;
  let mockUserRepository: jest.Mocked<DIUser>;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    } as jest.Mocked<DIUser>;

    deleteUserUC = new DeleteUserUC(mockUserRepository);

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("when the successfully use is delete", () => {
    it("must delete the user", async () => {
      const userId = 1;

      const mockUser: User = {
        id: 1,
        email: "usuario@exemplo.com",
        password: "hashed-password",
        name: "João Silva",
        isConfirmed: true,
        createdAt: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue(undefined);

      await deleteUserUC.execute(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
      expect(mockUserRepository.delete).toHaveBeenCalledTimes(1);
    });

    it("must log a message when the user is deleted", async () => {
      const userId = 42;

      const mockUser: User = {
        id: 42,
        email: "deletar@exemplo.com",
        password: "hashed",
        name: "Usuário a Deletar",
      } as User;

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.delete.mockResolvedValue(undefined);

      await deleteUserUC.execute(userId);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "✅ Usuário 42 (deletar@exemplo.com) deletado com sucesso"
      );
    });

    it("must work with different IDs", async () => {
      const userIds = [1, 999, 12345];

      for (const userId of userIds) {
        mockUserRepository.findById.mockResolvedValue({
          id: userId,
          email: `user${userId}@test.com`,
          password: "hashed",
          name: `User ${userId}`,
        } as User);
        mockUserRepository.delete.mockResolvedValue(undefined);

        await deleteUserUC.execute(userId);

        expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
      }
    });

    it("must return nothing", async () => {
      const userId = 1;

      mockUserRepository.findById.mockResolvedValue({
        id: 1,
        email: "test@test.com",
        password: "hashed",
        name: "Test",
      } as User);
      mockUserRepository.delete.mockResolvedValue(undefined);

      const result = await deleteUserUC.execute(userId);

      expect(result).toBeUndefined();
    });
  });

  describe("when the user does not exist", () => {
    it("must throw UserNotFoundError", async () => {
      const userId = 999;

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(deleteUserUC.execute(userId)).rejects.toThrow(
        UserNotFoundError
      );

      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it("must not log when the user does not exist", async () => {
      const userId = 999;

      mockUserRepository.findById.mockResolvedValue(null);

      try {
        await deleteUserUC.execute(userId);
      } catch (error) {}

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("must throw an error for different IDs that do not exist", async () => {
      const nonExistentIds = [1, 999, 12345];

      for (const userId of nonExistentIds) {
        mockUserRepository.findById.mockResolvedValue(null);

        await expect(deleteUserUC.execute(userId)).rejects.toThrow(
          UserNotFoundError
        );
      }
    });
  });

  describe("execution order", () => {
    it("must call in order: findById → delete → log", async () => {
      const userId = 1;
      const callOrder: string[] = [];

      mockUserRepository.findById.mockImplementation(async () => {
        callOrder.push("findById");
        return {
          id: 1,
          email: "test@test.com",
          password: "hashed",
          name: "Test",
        } as User;
      });

      mockUserRepository.delete.mockImplementation(async () => {
        callOrder.push("delete");
        return undefined;
      });

      consoleLogSpy.mockImplementation(() => {
        callOrder.push("log");
      });

      await deleteUserUC.execute(userId);

      expect(callOrder).toEqual(["findById", "delete", "log"]);
    });
  });

  describe("edge cases", () => {
    it("must call findById only once", async () => {
      const userId = 1;

      mockUserRepository.findById.mockResolvedValue({
        id: 1,
        email: "test@test.com",
        password: "hashed",
        name: "Test",
      } as User);
      mockUserRepository.delete.mockResolvedValue(undefined);

      await deleteUserUC.execute(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    });

    it("must call delete only once", async () => {
      const userId = 1;

      mockUserRepository.findById.mockResolvedValue({
        id: 1,
        email: "test@test.com",
        password: "hashed",
        name: "Test",
      } as User);
      mockUserRepository.delete.mockResolvedValue(undefined);

      await deleteUserUC.execute(userId);

      expect(mockUserRepository.delete).toHaveBeenCalledTimes(1);
    });
  });
});
