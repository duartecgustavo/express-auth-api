import { Request, Response } from "express";
import { DeleteUserUC } from "../../../application/use-cases/users/DeleteUser.useCase";
import { GetUserByIdUC } from "../../../application/use-cases/users/GetUserById.useCase";
import { GetUsersUC } from "../../../application/use-cases/users/GetUsers.useCase";
import { UpdateUserUC } from "../../../application/use-cases/users/UpdateUserById.useCase";
import {
  EmailAlreadyInUseError,
  WeakPasswordError,
} from "../../../domain/errors/auth.errors";
import {
  InvalidCredentialsError,
  UserNotConfirmedError,
  UserNotFoundError,
} from "../../../domain/errors/user.errors";

export class UserController {
  constructor(
    private readonly getUsersUC: GetUsersUC,
    private readonly getUserByIdUC: GetUserByIdUC,
    private readonly updateUserUC: UpdateUserUC,
    private readonly deleteUserUC: DeleteUserUC
  ) {}

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const dto = req.validatedQuery || req.query;
      const result = await this.getUsersUC.execute(dto);

      res.status(200).json({
        message: "Usuários listados com sucesso",
        data: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error("❌ Get users error:", error);
      res.status(500).json({ error: "Erro ao buscar usuários" });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.getUserByIdUC.execute(id);

      res.status(200).json({
        message: "Usuário encontrado com sucesso",
        user,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: "ID inválido. Deve ser um número" });
        return;
      }

      const dto = req.validatedBody || req.body;
      const user = await this.updateUserUC.execute(String(id), dto);

      res.status(200).json({
        message: "Usuário atualizado com sucesso!",
        user,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: "ID inválido. Deve ser um número" });
        return;
      }

      await this.deleteUserUC.execute(id);

      res.status(200).json({
        message: "Usuário removido com sucesso",
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
