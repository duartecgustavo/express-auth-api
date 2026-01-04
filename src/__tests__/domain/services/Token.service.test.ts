import jwt from "jsonwebtoken";
import { TokenService } from "../../../domain/services/Token.service";
import { TokenPayload } from "../../../infrastructure/http/middlewares/auth";

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
}));

describe("TokenService class", () => {
  let tokenService: TokenService;

  const userId = "user-123";
  const email = "user@test.com";

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.JWT_SECRET = "access-secret";
    process.env.JWT_REFRESH_SECRET = "refresh-secret";
    process.env.JWT_EXPIRATION = "15m";
    process.env.JWT_REFRESH_EXPIRATION = "7d";

    tokenService = new TokenService();
  });

  describe("pre config", () => {
    it("must throw an error if JWT secrets are not configured", () => {
      delete process.env.JWT_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      expect(() => new TokenService()).toThrow("❌ JWT secrets not configured");
    });

    it("must create TokenService when secrets are configured", () => {
      expect(() => new TokenService()).not.toThrow();
    });

    it("must use default expirations when env variables are not defined", () => {
      delete process.env.JWT_EXPIRATION;
      delete process.env.JWT_REFRESH_EXPIRATION;

      const fakeAccessToken = "access-token";
      const fakeRefreshToken = "refresh-token";

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(fakeAccessToken)
        .mockReturnValueOnce(fakeRefreshToken);

      const tokenService = new TokenService();

      tokenService.generateAccessToken("user-id", "email@test.com");
      tokenService.generateRefreshToken("user-id", "email@test.com");

      expect(jwt.sign).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ type: "access" }),
        "access-secret",
        { expiresIn: "15m" }
      );

      expect(jwt.sign).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ type: "refresh" }),
        "refresh-secret",
        { expiresIn: "7d" }
      );
    });
  });

  describe("generateAccessToken method", () => {
    it("must generate an access token", () => {
      const fakeToken = "access-token-fake";
      (jwt.sign as jest.Mock).mockReturnValueOnce(fakeToken);

      const token = tokenService.generateAccessToken(userId, email);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId, email, type: "access" },
        "access-secret",
        { expiresIn: "15m" }
      );
      expect(token).toBe(fakeToken);
    });
  });

  describe("generateRefreshToken method", () => {
    it("must generate an refresh token", () => {
      const fakeToken = "refresh-token-fake";
      (jwt.sign as jest.Mock).mockReturnValueOnce(fakeToken);

      const token = tokenService.generateRefreshToken(userId, email);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId, email, type: "refresh" },
        "refresh-secret",
        { expiresIn: "7d" }
      );
      expect(token).toBe(fakeToken);
    });
  });

  describe("generateRefreshToken method", () => {
    it("must generate an refresh token", () => {
      const fakeToken = "refresh-token-fake";
      (jwt.sign as jest.Mock).mockReturnValueOnce(fakeToken);

      const token = tokenService.generateRefreshToken(userId, email);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId, email, type: "refresh" },
        "refresh-secret",
        { expiresIn: "7d" }
      );
      expect(token).toBe(fakeToken);
    });
  });

  describe("verifyAccessToken class", () => {
    it("must verify an access token", () => {
      const payload: TokenPayload = {
        userId,
        email,
        type: "access",
        iat: 123,
        exp: 456,
      };

      (jwt.verify as jest.Mock).mockReturnValueOnce(payload);

      const result = tokenService.verifyAccessToken("access-token");

      expect(jwt.verify).toHaveBeenCalledWith("access-token", "access-secret");
      expect(result).toEqual(payload);
    });

    it("must throw error when access token is invalid", () => {
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error("invalid token");
      });

      const tokenService = new TokenService();

      expect(() => {
        tokenService.verifyAccessToken("invalid-token");
      }).toThrow("invalid token");
    });
  });

  describe("verifyAccessToken class", () => {
    it("must verify an refresh token", () => {
      const payload: TokenPayload = {
        userId,
        email,
        type: "refresh",
        iat: 123,
        exp: 456,
      };

      (jwt.verify as jest.Mock).mockReturnValueOnce(payload);

      const result = tokenService.verifyRefreshToken("refresh-token");

      expect(jwt.verify).toHaveBeenCalledWith(
        "refresh-token",
        "refresh-secret"
      );
      expect(result).toEqual(payload);
    });

    it("must throw error when refresh token is invalid", () => {
      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error("invalid token");
      });

      const tokenService = new TokenService();

      expect(() => {
        tokenService.verifyRefreshToken("invalid-token");
      }).toThrow("invalid token");
    });
  });

  describe("decodeToken class", () => {
    it("must verify an refresh token", () => {
      const payload: TokenPayload = {
        userId,
        email,
        type: "access",
        iat: 123,
        exp: 456,
      };

      (jwt.decode as jest.Mock).mockReturnValueOnce(payload);

      const result = tokenService.decodeToken("token");

      expect(jwt.decode).toHaveBeenCalledWith("token");
      expect(result).toEqual(payload);
    });

    it("must throw error when refresh token is invalid", () => {
      (jwt.decode as jest.Mock).mockImplementationOnce(() => {
        throw new Error("invalid token");
      });

      const tokenService = new TokenService();

      expect(() => {
        tokenService.decodeToken("token");
      }).toThrow("invalid token");
    });

    it("must return null when decode fails", () => {
      (jwt.decode as jest.Mock).mockReturnValueOnce(null);

      const tokenService = new TokenService();
      const result = tokenService.decodeToken("invalid-token");

      expect(result).toBeNull();
    });
  });
});
