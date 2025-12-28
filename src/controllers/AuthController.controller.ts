import { Request, Response } from "express";
import { LoginUserUC } from "../application/use-cases/LoginUser.useCase";
import { RegisterUserUC } from "../application/use-cases/RegisterUser.useCase";
import {
  EmailAlreadyInUseError,
  WeakPasswordError,
} from "../domain/errors/RegisterErrors.errors";
import {
  InvalidCredentialsError,
  UserNotConfirmedError,
} from "../domain/errors/UserError.errors";
import { userService } from "../services/userService";

// New Controller
export class UserController {
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
    }

    console.error("❌ Unexpected error:", error);
    res.status(500).json({
      error: "Erro interno no servidor",
    });
  }
}

// ===== Métodos gerais =====

const getUsers = async (req: Request, res: Response) => {
  try {
    const { users, total } = await userService.findAllUsers();

    res.status(200).json({
      message: "Lista de usuários recuperada com sucesso",
      users: users,
      total: total,
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

const getUserById = async (req: Request, res: Response) => {
  try {
    console.log("ID do usuário solicitado:", req.params.id);
    const result = await userService.findUserById(parseInt(req.params.id));

    if (!result) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    const { user } = result;

    return res.status(200).json({
      message: "Usuário encontrado com sucesso",
      user,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { email, password } = req.body;

    const result = await userService.updateUser(email, password, userId);

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    const { user: userResponse } = result;

    res.status(200).json({
      message: "Usuário atualizado com sucesso",
      user: userResponse,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);

  try {
    const result = await userService.deleteUser(userId);

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    res.status(200).json({
      message: "Usuário removido com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

export { deleteUser, getUserById, getUsers, updateUser };
