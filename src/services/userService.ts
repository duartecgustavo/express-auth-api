import { AppDataSource } from "../data-source";
import { User } from "../domain/entities/User";

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
