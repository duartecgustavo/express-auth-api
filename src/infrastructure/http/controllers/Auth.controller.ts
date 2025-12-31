import { Request, Response } from "express";
import { LoginUserUC } from "../../../application/use-cases/auth/LoginUser.useCase";
import { RegisterUserUC } from "../../../application/use-cases/auth/RegisterUser.useCase";
import {
  EmailAlreadyInUseError,
  WeakPasswordError,
} from "../../../domain/errors/auth.errors";
import {
  InvalidCredentialsError,
  UserNotConfirmedError,
  UserNotFoundError,
} from "../../../domain/errors/user.errors";

export class AuthController {
  constructor(
    private readonly registerUserUC: RegisterUserUC,
    private readonly loginUserUC: LoginUserUC
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.registerUserUC.execute(req.body);

      res.status(201).json({
        message: "Usuário criado com sucesso",
        user,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.loginUserUC.execute(req.body);

      res.status(200).json({
        message: "Login realizado com sucesso!",
        ...result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof EmailAlreadyInUseError) {
      res.status(409).json({ error: error.message });
      return;
    }

    if (error instanceof WeakPasswordError) {
      res.status(400).json({
        error: error.message,
        details: error.errors,
      });
      return;
    }

    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({
        error: error.message,
      });
      return;
    }

    if (error instanceof UserNotConfirmedError) {
      res.status(403).json({
        error: error.message,
        code: "EMAIL_NOT_CONFIRMED",
      });
      return;
    }

    if (error instanceof UserNotFoundError) {
      res.status(404).json({
        error: error.message,
      });
      return;
    }

    console.error("❌ Unexpected error:", error);
    res.status(500).json({
      error: "Erro interno no servidor",
    });
  }
}
