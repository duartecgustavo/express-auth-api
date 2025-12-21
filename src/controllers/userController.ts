import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { userService } from "../services/userService";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "teste123";

const findAllUsers = async (req: Request, res: Response) => {
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

const registerUsers = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    const result = await userService.registerUser(email, password, name);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      message: "Usuário criado com sucesso",
      user: result.user,
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

const loginUsers = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { email } });
  if (!user) return res.status(400).json({ error: "Usuário não encontrado" });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid)
    return res.status(400).json({ error: "Senha incorreta" });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ message: "Login realizado com sucesso!", token });
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

const removeUser = async (req: Request, res: Response) => {
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

export { findAllUsers, getUserById, registerUsers, loginUsers, updateUser, removeUser };
