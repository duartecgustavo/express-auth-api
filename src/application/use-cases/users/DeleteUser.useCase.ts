import { UserNotFoundError } from "../../../domain/errors/user.errors";
import { DIUser } from "../../../domain/repositories/IUser";

export class DeleteUserUC {
  constructor(private readonly userRepository: DIUser) {}
  async execute(userId: number): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    await this.userRepository.delete(userId);

    console.log(`✅ Usuário ${userId} (${user.email}) deletado com sucesso`);
  }
}
