import { Request, Response } from "express";
import { AuthController } from "../../../../infrastructure/http/controllers/Auth.controller";
import { ConfirmRegistrationUC } from "../../../../application/use-cases/auth/ConfirmRegistration.useCase";
import { LoginUserUC } from "../../../../application/use-cases/auth/LoginUser.useCase";
import { RegisterUserUC } from "../../../../application/use-cases/auth/RegisterUser.useCase";
import {
  EmailAlreadyInUseError,
  WeakPasswordError,
} from "../../../../domain/errors/auth.errors";
import {
  InvalidCredentialsError,
  UserNotConfirmedError,
  UserNotFoundError,
} from "../../../../domain/errors/user.errors";
import { PasswordErrorCode } from "../../../../domain/types/password.types";

describe("AuthController", () => {
  let authController: AuthController;
  let mockRegisterUserUC: jest.Mocked<RegisterUserUC>;
  let mockConfirmRegistrationUC: jest.Mocked<ConfirmRegistrationUC>;
  let mockLoginUserUC: jest.Mocked<LoginUserUC>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRegisterUserUC = {
      execute: jest.fn(),
    } as any;

    mockConfirmRegistrationUC = {
      execute: jest.fn(),
    } as any;

    mockLoginUserUC = {
      execute: jest.fn(),
    } as any;

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    authController = new AuthController(
      mockRegisterUserUC,
      mockConfirmRegistrationUC,
      mockLoginUserUC
    );
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("register", () => {
    describe("when registration is successful", () => {
      it("should register user and return 201", async () => {
        const mockResult = {
          message:
            "Cadastro iniciado. Verifique seu email e confirme o código para efetivar o cadastro.",
          email: "user@example.com",
        };

        mockReq.body = {
          email: "user@example.com",
          password: "StrongPass@123",
          name: "John Doe",
          nickname: "johndoe",
        };

        mockRegisterUserUC.execute.mockResolvedValue(mockResult);

        await authController.register(mockReq as Request, mockRes as Response);

        expect(mockRegisterUserUC.execute).toHaveBeenCalledWith(mockReq.body);
        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith(mockResult);
      });

      it("should call registerUserUC with request body", async () => {
        const requestBody = {
          email: "test@test.com",
          password: "Password@123",
          name: "Test User",
          nickname: "testuser",
        };

        mockReq.body = requestBody;
        mockRegisterUserUC.execute.mockResolvedValue({
          message: "Cadastro iniciado.",
          email: "test@test.com",
        });

        await authController.register(mockReq as Request, mockRes as Response);

        expect(mockRegisterUserUC.execute).toHaveBeenCalledWith(requestBody);
        expect(mockRegisterUserUC.execute).toHaveBeenCalledTimes(1);
      });
    });

    describe("when registration fails", () => {
      it("should return 409 for EmailAlreadyInUseError", async () => {
        mockReq.body = {
          email: "existing@example.com",
          password: "Password@123",
          name: "Test",
          nickname: "test",
        };

        const error = new EmailAlreadyInUseError();
        mockRegisterUserUC.execute.mockRejectedValue(error);

        await authController.register(mockReq as Request, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(jsonMock).toHaveBeenCalledWith({
          error: error.message,
        });
      });

      it("should return 400 for WeakPasswordError", async () => {
        mockReq.body = {
          email: "user@example.com",
          password: "weak",
          name: "Test",
        };

        const passwordErrors = [
          {
            code: PasswordErrorCode.MIN_LENGTH,
            message: "Password too short",
          },
          {
            code: PasswordErrorCode.UPPERCASE_REQUIRED,
            message: "Missing uppercase",
          },
        ];
        const error = new WeakPasswordError(passwordErrors);
        mockRegisterUserUC.execute.mockRejectedValue(error);

        await authController.register(mockReq as Request, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          error: error.message,
          details: passwordErrors,
        });
      });

      it("should return 500 for unexpected errors", async () => {
        mockReq.body = {
          email: "user@example.com",
          password: "Password@123",
          name: "Test",
        };

        const error = new Error("Unexpected database error");
        mockRegisterUserUC.execute.mockRejectedValue(error);

        await authController.register(mockReq as Request, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          error: "Erro interno no servidor",
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "❌ Unexpected error:",
          error
        );
      });
    });
  });

  describe("login", () => {
    describe("when login is successful", () => {
      it("should login user and return 200 with tokens", async () => {
        const mockLoginResult = {
          accessToken: "access-token-123",
          refreshToken: "refresh-token-456",
          expiresIn: 900,
          user: {
            id: "1",
            code: "user-code-123",
            email: "user@example.com",
            name: "John Doe",
            nickname: "johndoe",
            linkedin: null,
          },
        };

        mockReq.body = {
          email: "user@example.com",
          password: "Password@123",
        };

        mockLoginUserUC.execute.mockResolvedValue(mockLoginResult);

        await authController.login(mockReq as Request, mockRes as Response);

        expect(mockLoginUserUC.execute).toHaveBeenCalledWith(mockReq.body);
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          message: "Login realizado com sucesso!",
          accessToken: "access-token-123",
          refreshToken: "refresh-token-456",
          expiresIn: 900,
          user: {
            id: "1",
            code: "user-code-123",
            email: "user@example.com",
            name: "John Doe",
            nickname: "johndoe",
            linkedin: null,
          },
        });
      });

      it("should call loginUserUC with request body", async () => {
        const requestBody = {
          email: "test@test.com",
          password: "Password@123",
        };

        mockReq.body = requestBody;
        mockLoginUserUC.execute.mockResolvedValue({} as any);

        await authController.login(mockReq as Request, mockRes as Response);

        expect(mockLoginUserUC.execute).toHaveBeenCalledWith(requestBody);
        expect(mockLoginUserUC.execute).toHaveBeenCalledTimes(1);
      });

      it("should spread login result into response", async () => {
        const mockResult = {
          accessToken: "token",
          refreshToken: "refresh",
          expiresIn: 900,
          user: {
            id: "1",
            code: "code-1",
            email: "test@test.com",
            name: "Test",
            nickname: "test",
            linkedin: null,
          },
        };

        mockReq.body = { email: "test@test.com", password: "Pass@123" };
        mockLoginUserUC.execute.mockResolvedValue(mockResult);

        await authController.login(mockReq as Request, mockRes as Response);

        expect(jsonMock).toHaveBeenCalledWith({
          message: "Login realizado com sucesso!",
          ...mockResult,
        });
      });
    });

    describe("when login fails", () => {
      it("should return 401 for InvalidCredentialsError", async () => {
        mockReq.body = {
          email: "user@example.com",
          password: "WrongPassword@123",
        };

        const error = new InvalidCredentialsError();
        mockLoginUserUC.execute.mockRejectedValue(error);

        await authController.login(mockReq as Request, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
          error: error.message,
        });
      });

      it("should return 403 for UserNotConfirmedError", async () => {
        mockReq.body = {
          email: "unconfirmed@example.com",
          password: "Password@123",
        };

        const error = new UserNotConfirmedError();
        mockLoginUserUC.execute.mockRejectedValue(error);

        await authController.login(mockReq as Request, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
          error: error.message,
          code: "EMAIL_NOT_CONFIRMED",
        });
      });

      it("should return 404 for UserNotFoundError", async () => {
        mockReq.body = {
          email: "notfound@example.com",
          password: "Password@123",
        };

        const error = new UserNotFoundError("123");
        mockLoginUserUC.execute.mockRejectedValue(error);

        await authController.login(mockReq as Request, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith({
          error: error.message,
        });
      });

      it("should return 500 for unexpected errors", async () => {
        mockReq.body = {
          email: "user@example.com",
          password: "Password@123",
        };

        const error = new Error("Database connection failed");
        mockLoginUserUC.execute.mockRejectedValue(error);

        await authController.login(mockReq as Request, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
          error: "Erro interno no servidor",
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "❌ Unexpected error:",
          error
        );
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
        mockRegisterUserUC.execute.mockRejectedValue(scenario.error);
        statusMock.mockClear();
        jsonMock.mockClear();

        await authController.register(mockReq as Request, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(scenario.expectedStatus);
        expect(jsonMock).toHaveBeenCalledWith(scenario.expectedResponse);
      }
    });

    it("should log unexpected errors to console", async () => {
      const unexpectedError = new Error("Unexpected error");
      mockRegisterUserUC.execute.mockRejectedValue(unexpectedError);

      await authController.register(mockReq as Request, mockRes as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Unexpected error:",
        unexpectedError
      );
    });

    it("should return 500 for non-Error objects", async () => {
      const strangeError = { weird: "error object" };
      mockRegisterUserUC.execute.mockRejectedValue(strangeError);

      await authController.register(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Erro interno no servidor",
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty request body", async () => {
      mockReq.body = {};
      mockRegisterUserUC.execute.mockResolvedValue({} as any);

      await authController.register(mockReq as Request, mockRes as Response);

      expect(mockRegisterUserUC.execute).toHaveBeenCalledWith({});
    });

    it("should not modify request body", async () => {
      const originalBody = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test",
      };

      mockReq.body = { ...originalBody };
      mockRegisterUserUC.execute.mockResolvedValue({} as any);

      await authController.register(mockReq as Request, mockRes as Response);

      expect(mockReq.body).toEqual(originalBody);
    });

    it("should handle use case returning null/undefined gracefully", async () => {
      mockReq.body = { email: "test@test.com", password: "Pass@123" };
      mockLoginUserUC.execute.mockResolvedValue(null as any);

      await authController.login(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});
