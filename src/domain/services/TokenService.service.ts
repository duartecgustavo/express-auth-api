import jwt from "jsonwebtoken";
import { TokenPayload } from "../../middlewares/auth";

export class TokenService {
  private readonly accessTokenSecret: string;
  private readonly accessTokenExpiration: string;
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenExpiration: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET!;
    this.accessTokenExpiration = process.env.JWT_EXPIRATION || "15m";
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
    this.refreshTokenExpiration = process.env.JWT_REFRESH_EXPIRATION || "7d";

    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error("❌ JWT secrets not configured");
    }
  }

  generateAccessToken(userId: string, email: string): string {
    return jwt.sign({ userId, email, type: "access" }, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiration,
    });
  }

  generateRefreshToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email, type: "refresh" },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiration }
    );
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.refreshTokenSecret) as TokenPayload;
  }

  decodeToken(token: string): TokenPayload | null {
    return jwt.decode(token) as TokenPayload | null;
  }
}
