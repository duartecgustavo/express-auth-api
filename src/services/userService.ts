import { AppDataSource } from "../data-source";
import { User } from "../domain/entities/User";

class UserService {
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
