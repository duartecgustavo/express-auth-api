import { randomUUID } from "crypto";
import {
  InvalidVerificationCodeError,
  PendingRegistrationNotFoundError,
} from "../../../domain/errors/auth.errors";
import { User } from "../../../domain/entities/User.entity";
import { DIUser } from "../../../domain/repositories/IUser";
import { IPendingRegistrationRepository } from "../../../domain/repositories/IPendingRegistration";
import { IVerificationService } from "../../../domain/services/Verification.service";
import { ConfirmRegistrationDto } from "../../dtos/auth/confirm-registration.dto";

export class ConfirmRegistrationUC {
  constructor(
    private readonly userRepository: DIUser,
    private readonly pendingRepository: IPendingRegistrationRepository,
    private readonly verificationService: IVerificationService
  ) {}

  async execute(
    dto: ConfirmRegistrationDto
  ): Promise<Omit<User, "password">> {
    const { email, code } = dto;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Validar código com Twilio
    const isValid = await this.verificationService.verifyCode(
      normalizedEmail,
      code
    );
    if (!isValid) {
      throw new InvalidVerificationCodeError();
    }

    // 2. Buscar cadastro pendente
    const pending = await this.pendingRepository.findByEmail(normalizedEmail);
    if (!pending) {
      throw new PendingRegistrationNotFoundError();
    }

    // 3. Verificar se não expirou
    if (new Date() > pending.expiresAt) {
      await this.pendingRepository.deleteByEmail(normalizedEmail);
      throw new PendingRegistrationNotFoundError();
    }

    // 4. Verificar se email já foi usado (race condition)
    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      await this.pendingRepository.deleteByEmail(normalizedEmail);
      throw new PendingRegistrationNotFoundError();
    }

    // 5. Criar usuário
    const user = new User();
    user.code = randomUUID();
    user.email = normalizedEmail;
    user.password = pending.password;
    user.name = pending.name;
    user.nickname = pending.nickname;
    user.linkedin = pending.linkedin;
    user.isConfirmed = true;

    const savedUser = await this.userRepository.save(user);

    // 6. Remover pendente
    await this.pendingRepository.deleteByEmail(normalizedEmail);

    const { password: _, ...userResponse } = savedUser;
    return userResponse;
  }
}
