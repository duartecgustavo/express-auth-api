import { Request, Response } from "express";
import { UserController } from "../../../../infrastructure/http/controllers/User.controller";
import { GetUsersUC } from "../../../../application/use-cases/users/GetUsers.useCase";
import { GetUserByIdUC } from "../../../../application/use-cases/users/GetUserById.useCase";
import { UpdateUserUC } from "../../../../application/use-cases/users/UpdateUserById.useCase";
import { DeleteUserUC } from "../../../../application/use-cases/users/DeleteUser.useCase";
import {
  EmailAlreadyInUseError,
  WeakPasswordError,
} from "../../../../domain/errors/auth.errors";
import {
  UserNotFoundError,
  InvalidCredentialsError,
  UserNotConfirmedError,
} from "../../../../domain/errors/user.errors";
import { PasswordErrorCode } from "../../../../domain/types/password.types";

describe("UserController", () => {
  let userController: UserController;
  let mockGetUsersUC: jest.Mocked<GetUsersUC>;
  let mockGetUserByIdUC: jest.Mocked<GetUserByIdUC>;
  let mockUpdateUserUC: jest.Mocked<UpdateUserUC>;
  let mockDeleteUserUC: jest.Mocked<DeleteUserUC>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockGetUsersUC = {
      execute: jest.fn(),
    } as any;

    mockGetUserByIdUC = {
      execute: jest.fn(),
    } as any;

    mockUpdateUserUC = {
      execute: jest.fn(),
    } as any;

    mockDeleteUserUC = {
      execute: jest.fn(),
    } as any;

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockReq = {
      params: {},
      query: {},
      body: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    userController = new UserController(
      mockGetUsersUC,
      mockGetUserByIdUC,
      mockUpdateUserUC,
      mockDeleteUserUC
    );
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("getUsers", () => {
    describe("when getting users is successful", () => {
      it("should return paginated users with 200", async () => {
        const mockResult = {
          users: [
            {
              id: 1,
              email: "user1@test.com",
              name: "User 1",
              isConfirmed: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: 2,
              email: "user2@test.com",
              name: "User 2",
              isConfirmed: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        };

        mockReq.query = { page: "1", limit: "10" };
        mockGetUsersUC.execute.mockResolvedValue(mockResult);

        await userController.getUsers(mockReq as Request, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          message: "Usuários listados com sucesso",
          data: mockResult.users,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        });
      });

      it("should use validatedQuery if available", async () => {
        const mockResult = {
          users: [],
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        };

        mockReq.validatedQuery = { page: 2, limit: 20 };
        mockReq.query = { page: "1", limit: "10" };
        mockGetUsersUC.execute.mockResolvedValue(mockResult);

        await userController.getUsers(mockReq as Request, mockRes as Response);

        expect(mockGetUsersUC.execute).toHaveBeenCalledWith({
          page: 2,
          limit: 20,
        });
      });

      it("should fallback to req.query if validatedQuery is not available", async () => {
        const mockResult = {
          users: [],
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        };

        mockReq.query = { page: "1", limit: "10" };
        mockGetUsersUC.execute.mockResolvedValue(mockResult);

        await userController.getUsers(mockReq as Request, mockRes as Response);

        expect(mockGetUsersUC.execute).toHaveBeenCalledWith(mockReq.query);
      });
    });

    describe("when getting users fails", () => {
      it("should return 500 for unexpected errors", async () => {
        const error = new Error("Database error");
        mockReq.query = {};
        mockGetUsersUC.execute.mockRejectedValue(error);

        await userController.getUsers(mockReq as Request, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          error: "Erro ao buscar usuários",
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "❌ Get users error:",
          error
        );
      });
    });
  });

  describe("getUserById", () => {
    describe("when getting user by id is successful", () => {
      it("should return user with 200", async () => {
        const mockUser = {
          id: 1,
          email: "user@test.com",
          name: "Test User",
          isConfirmed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockReq.params = { id: "1" };
        mockGetUserByIdUC.execute.mockResolvedValue(mockUser);

        await userController.getUserById(
          mockReq as Request,
          mockRes as Response
        );

        expect(mockGetUserByIdUC.execute).toHaveBeenCalledWith("1");
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          message: "Usuário encontrado com sucesso",
          user: mockUser,
        });
      });

      it("should work with different user IDs", async () => {
        const userIds = ["1", "42", "999"];

        for (const id of userIds) {
          mockReq.params = { id };
          mockGetUserByIdUC.execute.mockResolvedValue({} as any);

          await userController.getUserById(
            mockReq as Request,
            mockRes as Response
          );

          expect(mockGetUserByIdUC.execute).toHaveBeenCalledWith(id);
        }
      });
    });

    describe("when getting user by id fails", () => {
      it("should return 404 for UserNotFoundError", async () => {
        mockReq.params = { id: "999" };
        const error = new UserNotFoundError("999");
        mockGetUserByIdUC.execute.mockRejectedValue(error);

        await userController.getUserById(
          mockReq as Request,
          mockRes as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          error: error.message,
        });
      });
    });
  });

  describe("updateUser", () => {
    describe("when updating user is successful", () => {
      it("should update user and return 200", async () => {
        const mockUser = {
          id: 1,
          email: "updated@test.com",
          name: "Updated Name",
          isConfirmed: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockReq.params = { id: "1" };
        mockReq.body = { name: "Updated Name" };
        mockUpdateUserUC.execute.mockResolvedValue(mockUser);

        await userController.updateUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(mockUpdateUserUC.execute).toHaveBeenCalledWith(
          "1",
          mockReq.body
        );
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          message: "Usuário atualizado com sucesso!",
          user: mockUser,
        });
      });

      it("should use validatedBody if available", async () => {
        mockReq.params = { id: "1" };
        mockReq.validatedBody = { name: "Validated Name" };
        mockReq.body = { name: "Body Name" };
        mockUpdateUserUC.execute.mockResolvedValue({} as any);

        await userController.updateUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(mockUpdateUserUC.execute).toHaveBeenCalledWith("1", {
          name: "Validated Name",
        });
      });

      it("should fallback to req.body if validatedBody is not available", async () => {
        mockReq.params = { id: "1" };
        mockReq.body = { name: "Body Name" };
        mockUpdateUserUC.execute.mockResolvedValue({} as any);

        await userController.updateUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(mockUpdateUserUC.execute).toHaveBeenCalledWith("1", {
          name: "Body Name",
        });
      });

      it("should convert id to string when calling use case", async () => {
        mockReq.params = { id: "42" };
        mockReq.body = {};
        mockUpdateUserUC.execute.mockResolvedValue({} as any);

        await userController.updateUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(mockUpdateUserUC.execute).toHaveBeenCalledWith("42", {});
      });
    });

    describe("when updating user fails", () => {
      it("should return 400 for invalid ID (NaN)", async () => {
        mockReq.params = { id: "invalid" };
        mockReq.body = { name: "Test" };

        await userController.updateUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: "ID inválido. Deve ser um número",
        });
        expect(mockUpdateUserUC.execute).not.toHaveBeenCalled();
      });

      it("should return 404 for UserNotFoundError", async () => {
        mockReq.params = { id: "999" };
        mockReq.body = { name: "Test" };
        const error = new UserNotFoundError("999");
        mockUpdateUserUC.execute.mockRejectedValue(error);

        await userController.updateUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          error: error.message,
        });
      });

      it("should return 409 for EmailAlreadyInUseError", async () => {
        mockReq.params = { id: "1" };
        mockReq.body = { email: "existing@test.com" };
        const error = new EmailAlreadyInUseError();
        mockUpdateUserUC.execute.mockRejectedValue(error);

        await userController.updateUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(jsonMock).toHaveBeenCalledWith({
          error: error.message,
        });
      });

      it("should return 400 for WeakPasswordError", async () => {
        mockReq.params = { id: "1" };
        mockReq.body = { password: "weak" };
        const error = new WeakPasswordError([
          {
            code: PasswordErrorCode.MIN_LENGTH,
            message: "Password too short",
          },
        ]);
        mockUpdateUserUC.execute.mockRejectedValue(error);

        await userController.updateUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: error.message,
          details: error.errors,
        });
      });
    });
  });

  describe("deleteUser", () => {
    describe("when deleting user is successful", () => {
      it("should delete user and return 200", async () => {
        mockReq.params = { id: "1" };
        mockDeleteUserUC.execute.mockResolvedValue(undefined);

        await userController.deleteUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(mockDeleteUserUC.execute).toHaveBeenCalledWith(1);
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          message: "Usuário removido com sucesso",
        });
      });

      it("should convert string id to number", async () => {
        mockReq.params = { id: "42" };
        mockDeleteUserUC.execute.mockResolvedValue(undefined);

        await userController.deleteUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(mockDeleteUserUC.execute).toHaveBeenCalledWith(42);
      });

      it("should work with different user IDs", async () => {
        const userIds = ["1", "10", "999"];

        for (const id of userIds) {
          mockReq.params = { id };
          mockDeleteUserUC.execute.mockResolvedValue(undefined);

          await userController.deleteUser(
            mockReq as Request,
            mockRes as Response
          );

          expect(mockDeleteUserUC.execute).toHaveBeenCalledWith(Number(id));
        }
      });
    });

    describe("when deleting user fails", () => {
      it("should return 400 for invalid ID (NaN)", async () => {
        mockReq.params = { id: "invalid" };

        await userController.deleteUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: "ID inválido. Deve ser um número",
        });
        expect(mockDeleteUserUC.execute).not.toHaveBeenCalled();
      });

      it("should return 404 for UserNotFoundError", async () => {
        mockReq.params = { id: "999" };
        const error = new UserNotFoundError("999");
        mockDeleteUserUC.execute.mockRejectedValue(error);

        await userController.deleteUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          error: error.message,
        });
      });
    });
  });

  describe("handleError", () => {
    it("should handle all known error types correctly", async () => {
      const errorScenarios = [
        {
          error: new EmailAlreadyInUseError(),
          expectedStatus: 409,
          expectedResponse: { error: expect.any(String) },
        },
        {
          error: new WeakPasswordError([
            {
              code: PasswordErrorCode.MIN_LENGTH,
              message: "Too short",
            },
          ]),
          expectedStatus: 400,
          expectedResponse: {
            error: expect.any(String),
            details: expect.any(Array),
          },
        },
        {
          error: new InvalidCredentialsError(),
          expectedStatus: 401,
          expectedResponse: { error: expect.any(String) },
        },
        {
          error: new UserNotConfirmedError(),
          expectedStatus: 403,
          expectedResponse: {
            error: expect.any(String),
            code: "EMAIL_NOT_CONFIRMED",
          },
        },
        {
          error: new UserNotFoundError("123"),
          expectedStatus: 404,
          expectedResponse: { error: expect.any(String) },
        },
      ];

      for (const scenario of errorScenarios) {
        mockReq.params = { id: "1" };
        mockGetUserByIdUC.execute.mockRejectedValue(scenario.error);
        statusMock.mockClear();
        jsonMock.mockClear();

        await userController.getUserById(
          mockReq as Request,
          mockRes as Response
        );

        expect(statusMock).toHaveBeenCalledWith(scenario.expectedStatus);
        expect(jsonMock).toHaveBeenCalledWith(scenario.expectedResponse);
      }
    });

    it("should log unexpected errors to console", async () => {
      const unexpectedError = new Error("Unexpected error");
      mockReq.params = { id: "1" };
      mockGetUserByIdUC.execute.mockRejectedValue(unexpectedError);

      await userController.getUserById(mockReq as Request, mockRes as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Unexpected error:",
        unexpectedError
      );
    });

    it("should return 500 for unexpected errors", async () => {
      const error = new Error("Unknown error");
      mockReq.params = { id: "1" };
      mockGetUserByIdUC.execute.mockRejectedValue(error);

      await userController.getUserById(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Erro interno no servidor",
      });
    });
  });

  describe("edge cases", () => {
    it("should handle ID '0' as valid", async () => {
      mockReq.params = { id: "0" };
      mockDeleteUserUC.execute.mockResolvedValue(undefined);

      await userController.deleteUser(mockReq as Request, mockRes as Response);

      expect(mockDeleteUserUC.execute).toHaveBeenCalledWith(0);
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("should handle negative IDs as valid numbers", async () => {
      mockReq.params = { id: "-1" };
      mockDeleteUserUC.execute.mockResolvedValue(undefined);

      await userController.deleteUser(mockReq as Request, mockRes as Response);

      expect(mockDeleteUserUC.execute).toHaveBeenCalledWith(-1);
    });

    it("should reject non-numeric IDs", async () => {
      const invalidIds = ["abc", "user-123", "null", "undefined", "NaN"];

      for (const id of invalidIds) {
        mockReq.params = { id };
        mockReq.body = {};
        statusMock.mockClear();
        jsonMock.mockClear();

        await userController.updateUser(
          mockReq as Request,
          mockRes as Response
        );

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: "ID inválido. Deve ser um número",
        });
      }
    });

    it("should treat empty string as valid (converts to 0)", async () => {
      mockReq.params = { id: "" };
      mockReq.body = { name: "Test" };
      mockUpdateUserUC.execute.mockResolvedValue({} as any);

      await userController.updateUser(mockReq as Request, mockRes as Response);

      expect(mockUpdateUserUC.execute).toHaveBeenCalledWith("0", {
        name: "Test",
      });
      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});
