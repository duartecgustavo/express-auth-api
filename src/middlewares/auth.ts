import jsonwebtoken from "jsonwebtoken";
import { NextFunction, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

const JWT_SECRET = "teste123";

function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Token obrigatório" });
    return;
  }

  jsonwebtoken.verify(
    token,
    JWT_SECRET,
    (err: Error | null, user: string | JwtPayload | undefined) => {
      if (err) return res.status(403).json({ error: "Token inválido" });
      req.user = user;
      next();
    }
  );
}

export { authMiddleware, JWT_SECRET };
