import { User } from "../../domain/entities/User";
import { EmailAlreadyInUseError } from "../../domain/errors/RegisterErrors.errors";
import {
  NoFieldsToUpdateError,
  UserNotFoundError,
} from "../../domain/errors/UserError.errors";
import { DIUser } from "../../domain/repositories/dependency-injection-user.di";
import { MailService } from "../../domain/services/MailService.service";
import { PasswordService } from "../../domain/services/PasswordService.service";
import { UpdateUserDto } from "../dtos/update-user.dto";

export class UpdateUserUC {
  constructor(
    private readonly userRepository: DIUser,
    private readonly passwordService: PasswordService,
    private readonly mailService: MailService
  ) {}

  async execute(
    userId: string,
    dto: UpdateUserDto
  ): Promise<Omit<User, "password">> {
    if (!dto.email && !dto.name && !dto.name && dto.isConfirmed === undefined) {
      throw new NoFieldsToUpdateError();
    }

    const user = await this.userRepository.findById(Number(userId));

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (dto.email) {
      const normalizedEmail = this.mailService.normalize(dto.email);

      if (normalizedEmail !== user.email) {
        const existingUser = await this.userRepository.findByEmail(
          normalizedEmail
        );

        if (existingUser && existingUser.id !== Number(userId)) {
          throw new EmailAlreadyInUseError();
        }

        user.email = normalizedEmail;
      }
    }

    if (dto.password) {
      const passwordValidation = this.passwordService.validate(dto.password);

      if (!passwordValidation.isValid) {
        throw new Error(`Senha fraca ${passwordValidation.errors.join(", ")}`);
      }

      user.password = await this.passwordService.hash(dto.password);
    }

    if (dto.name) {
      user.name = dto.name.trim();

      if (dto.isConfirmed !== undefined) {
        user.isConfirmed = dto.isConfirmed;
      }
    }

    const updatedUser = await this.userRepository.save(user);

    const { password, ...userWithoutPassword } = updatedUser;

    return userWithoutPassword;
  }
}
