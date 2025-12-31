import { User } from "../../../domain/entities/User.entity";
import { UserNotFoundError } from "../../../domain/errors/user.errors";
import { DIUser } from "../../../domain/repositories/IUser";

export class GetUserByIdUC {
  constructor(private readonly userRepository: DIUser) {}

  async execute(userId: string): Promise<Omit<User, "password">> {
    const user = await this.userRepository.findById(Number(userId));

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}
