import {
  EmailAlreadyInUseError,
  WeakPasswordError,
} from "../../../domain/errors/auth.errors";
import { MailService } from "../../../domain/services/Email.service";
import { PasswordService } from "../../../domain/services/Password.service";
import { RegisterUserDto } from "../../dtos/auth/register.dto";
import { User } from "../../../domain/entities/User.entity";
import { DIUser } from "../../../domain/repositories/IUser";

export class RegisterUserUC {
  constructor(
    private readonly userRepository: DIUser,
    private readonly passWordService: PasswordService,
    private readonly emailService: MailService
  ) {}

  async execute(dto: RegisterUserDto): Promise<Omit<User, "password">> {
    const { email, name, password } = dto;

    // 1. Normalizar email
    const normalizedEmail = this.emailService.normalize(email);

    // 2. Verificar se o email já existe
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyInUseError();
    }

    // 3. Validar senha
    const passwordValidation = this.passWordService.validate(password);
    if (!passwordValidation.isValid) {
      throw new WeakPasswordError(passwordValidation.errors);
    }

    // 4. Criar hash da senha
    const hashedPassword = await this.passWordService.hash(password);

    // 5. Criar entidade do usuario
    const user = new User();
    user.email = normalizedEmail;
    user.password = hashedPassword as unknown as string;
    user.name = name.trim();
    user.isConfirmed = false;

    // 6. Salvar usuario
    const savedUser = await this.userRepository.save(user);

    // 7. Remover senha do retorno
    const { password: _, ...userResponse } = savedUser;

    return userResponse;
  }
}
