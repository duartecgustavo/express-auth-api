process.env.JWT_SECRET = "test-secret";
import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import {
  AuthenticatedRequest,
  authMiddleware,
  TokenPayload,
} from "../../../../infrastructure/http/middlewares/auth.middleware";

jest.mock("jsonwebtoken");
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe("authMiddleware", () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockReq = {
      headers: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe("when the token is valid", () => {
    it("must authenticate with a valid token and call next()", () => {
      const mockPayload: TokenPayload = {
        userId: "123",
        email: "user@test.com",
      };

      mockReq.headers = {
        authorization: "Bearer valid-token-123",
      };

      mockedJwt.verify.mockImplementation(() => mockPayload as TokenPayload);

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockedJwt.verify).toHaveBeenCalledWith(
        "valid-token-123",
        JWT_SECRET
      );
      expect(mockReq.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
    it("must add user to the request", () => {
      const mockPayload: TokenPayload = {
        userId: "42",
        email: "test@example.com",
      };

      mockReq.headers = {
        authorization: "Bearer token-abc",
      };

      mockedJwt.verify.mockImplementation(() => mockPayload as TokenPayload);

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe("42");
      expect(mockReq.user?.email).toBe("test@example.com");
    });

    it("must accept different types of token", () => {
      const mockPayload: TokenPayload = {
        userId: "1",
        email: "test@test.com",
      };

      const tokens = ["token1", "token2", "very-long-token-123-abc"];

      tokens.forEach((token) => {
        mockReq.headers = {
          authorization: `Bearer ${token}`,
        };

        mockedJwt.verify.mockImplementation(() => mockPayload as TokenPayload);

        authMiddleware(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext
        );

        expect(mockedJwt.verify).toHaveBeenCalledWith(token, JWT_SECRET);
      });
    });
  });

  describe("when Authorization header is missing", () => {
    it("must throw 401 without header", () => {
      mockReq.headers = {};

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Authorization header missing",
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockedJwt.verify).not.toHaveBeenCalled();
    });

    it("does not add user to the request", () => {
      mockReq.headers = {};

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.user).toBeUndefined();
    });
  });

  describe("when the token format is invalid", () => {
    it("must throw 401 when Bearer is missing", () => {
      mockReq.headers = {
        authorization: "only-token-without-bearer",
      };

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid token format. Use: Bearer <token>",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("must throw 401 when Bearer is wrong", () => {
      mockReq.headers = {
        authorization: "Bear token123",
      };

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid token format. Use: Bearer <token>",
      });
    });

    it("must throw 401 when the format has more than two parts", () => {
      mockReq.headers = {
        authorization: "Bearer token extra-part",
      };

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid token format. Use: Bearer <token>",
      });
    });

    it("must throw 401 when token has only one part", () => {
      mockReq.headers = {
        authorization: "Bearer",
      };

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid token format. Use: Bearer <token>",
      });
    });
  });

  describe("when the token is expired", () => {
    it("must throw 401 with expirated message", () => {
      mockReq.headers = {
        authorization: "Bearer expired-token",
      };

      const expiredError = new jwt.TokenExpiredError("jwt expired", new Date());
      mockedJwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Token expired",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("when the token is invalid", () => {
    it("must throw 403 for an incorrect token", () => {
      mockReq.headers = {
        authorization: "Bearer invalid-token",
      };

      const jwtError = new jwt.JsonWebTokenError("invalid token");
      mockedJwt.verify.mockImplementation(() => {
        throw jwtError;
      });

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid token",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("must throw 403 when payload is a string", () => {
      mockReq.headers = {
        authorization: "Bearer token",
      };

      mockedJwt.verify.mockImplementation(() => "string-payload" as string);

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid token payload",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("when an unknow error occurs", () => {
    it("must throw 500 for generic errors", () => {
      mockReq.headers = {
        authorization: "Bearer token",
      };

      const genericError = new Error("Unexpected error");
      mockedJwt.verify.mockImplementation(() => {
        throw genericError;
      });

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Token validation failed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("security", () => {
    it("must verify the jwt token correctly", () => {
      const mockPayload: TokenPayload = {
        userId: "1",
        email: "test@test.com",
      };

      mockReq.headers = {
        authorization: "Bearer token",
      };

      mockedJwt.verify.mockImplementation(() => mockPayload as TokenPayload);

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockedJwt.verify).toHaveBeenCalledWith("token", JWT_SECRET);
    });

    it("does not proccess the resquest or call next() in error cases", () => {
      const errorScenarios = [
        { headers: {} },
        { headers: { authorization: "invalid" } },
      ];

      errorScenarios.forEach((scenario) => {
        mockReq = scenario;
        mockNext = jest.fn();

        authMiddleware(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext
        );

        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    it("must never return void", () => {
      const mockPayload: TokenPayload = {
        userId: "1",
        email: "test@test.com",
      };

      mockReq.headers = {
        authorization: "Bearer token",
      };

      mockedJwt.verify.mockImplementation(() => mockPayload as TokenPayload);

      const result = authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(result).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("must be case-sensitive with Bearer", () => {
      mockReq.headers = {
        authorization: "bearer token",
      };

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Invalid token format. Use: Bearer <token>",
      });
    });

    it("must work with extras fields in the payload", () => {
      mockReq.headers = {
        authorization: "Bearer token",
      };

      const payloadWithExtras = {
        userId: "1",
        email: "test@test.com",
        role: "admin",
        iat: 123456,
        exp: 999999,
      };

      mockedJwt.verify.mockImplementation(
        () => payloadWithExtras as TokenPayload
      );

      authMiddleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.user).toEqual(payloadWithExtras);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
