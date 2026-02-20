import {
  EmailAlreadyInUseError,
  WeakPasswordError,
} from "../../../domain/errors/auth.errors";
import { MailService } from "../../../domain/services/Email.service";
import { PasswordService } from "../../../domain/services/Password.service";
import { IVerificationService } from "../../../domain/services/Verification.service";
import { RegisterUserDto } from "../../dtos/auth/register.dto";
import { DIUser } from "../../../domain/repositories/IUser";
import { IPendingRegistrationRepository } from "../../../domain/repositories/IPendingRegistration";
import { PendingRegistration } from "../../../domain/entities/PendingRegistration.entity";

const PENDING_EXPIRY_MINUTES = 15;

export class RegisterUserUC {
  constructor(
    private readonly userRepository: DIUser,
    private readonly pendingRepository: IPendingRegistrationRepository,
    private readonly passWordService: PasswordService,
    private readonly emailService: MailService,
    private readonly verificationService: IVerificationService
  ) {}

  async execute(dto: RegisterUserDto): Promise<{ message: string; email: string }> {
    const { email, name, password, nickname, linkedin } = dto;

    // 1. Normalizar email
    const normalizedEmail = this.emailService.normalize(email);

    // 2. Verificar se o email já existe como usuário
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
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

    // 5. Salvar ou atualizar cadastro pendente
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + PENDING_EXPIRY_MINUTES);

    const pending = new PendingRegistration();
    pending.email = normalizedEmail;
    pending.password = hashedPassword as unknown as string;
    pending.name = name.trim();
    pending.nickname = nickname.trim();
    pending.linkedin = linkedin?.trim() || null;
    pending.expiresAt = expiresAt;

    await this.pendingRepository.save(pending);

    // 6. Enviar código por email via Twilio Verify
    await this.verificationService.sendCode(normalizedEmail);

    return {
      message:
        "Cadastro iniciado. Verifique seu email e confirme o código para efetivar o cadastro.",
      email: normalizedEmail,
    };
  }
}
