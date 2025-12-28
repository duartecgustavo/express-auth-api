import { InvalidCredentialsError } from "../../domain/errors/UserError.errors";
import { MailService } from "../../domain/services/MailService.service";
import { PasswordService } from "../../domain/services/PasswordService.service";
import { TokenService } from "../../domain/services/TokenService.service";
import { LoginUserDto } from "../dtos/login.dto";
import { DIUser } from "../../domain/repositories/dependency-injection-user.di";

interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export class LoginUserUC {
  constructor(
    private readonly userRepository: DIUser,
    private readonly passwordService: PasswordService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService
  ) {}

  async execute(dto: LoginUserDto): Promise<ILoginResponse> {
    const { email, password } = dto;

    // 1. Normalizar email
    const normalizedEmail = this.mailService.normalize(email);

    // 2. Buscar usuario pelo email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // 3. Validar senha
    const isPasswordValid = this.passwordService.compare(
      password,
      user.password
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // 4. Verificar se o email esta confirmado
    // bypassed

    // 5. Gerar tokens
    const accessToken = this.tokenService.generateAccessToken(
      String(user.id),
      user.email
    );
    const refreshToken = this.tokenService.generateRefreshToken(
      String(user.id),
      user.email
    );

    // 6. Retornar resposta
    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: String(user.id),
        email: user.email,
        name: user.name,
      },
    };
  }
}
