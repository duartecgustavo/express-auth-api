import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";


class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async findAllUsers() {
    try {
      const users = await this.userRepository.find();

      const usersWithoutPassword = await this.removePassword(users);

      return {
        users: usersWithoutPassword,
        total: usersWithoutPassword.length,
      };
    } catch (error) {
      throw new Error("Erro ao buscar usuários");
    }
  }

  async removePassword(users: User[]) {
    const usersWithoutPassword = users.map((user) => {
      const { password, ...userWithoutPass } = user;
      return userWithoutPass;
    });

    return usersWithoutPassword;
  }

  async findUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPass } = user;
    return { user: userWithoutPass };
  }

  async registerUser(email: string, password: string, name: string) {
    if (!email || !password || !name) {
      return {
        error:
          "Todos os campos são obrigatórios: email, password, confirmationCode",
      };
    }

    const userRepository = AppDataSource.getRepository(User);

    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return {
        error: "Email já está em uso",
      };
    }


    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = userRepository.create({
      email,
      password: hashedPassword,
      name,
      isConfirmed: false,
    });

    await userRepository.save(newUser);
    const { password: _, ...userResponse } = newUser;

    return {
      message: "Usuário criado com sucesso",
      user: userResponse,
    };
  }

  async updateUser(email: string, password: string, userId: number) {
    const userRepository = AppDataSource.getRepository(User);
    const userToUpdate = await userRepository.findOne({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return { error: "Usuário não encontrado" };
    }

    if (email) userToUpdate.email = email;
    if (password) userToUpdate.password = password;

    await userRepository.save(userToUpdate);

    const { password: _, ...userResponse } = userToUpdate;

    return {
      message: "Usuário atualizado com sucesso",
      user: userResponse,
    };
  }

  async deleteUser(userId: number) {
    const userRepository = AppDataSource.getRepository(User);
    const userToDelete = await userRepository.findOne({
      where: { id: userId },
    });

    if (!userToDelete) {
      return { error: "Usuário não encontrado" };
    }

    await userRepository.remove(userToDelete);

    return { message: "Usuário deletado com sucesso" };
  }
}
export const userService = new UserService();
