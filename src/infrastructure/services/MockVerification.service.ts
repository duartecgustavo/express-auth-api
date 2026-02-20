import { IVerificationService } from "../../domain/services/Verification.service";

/**
 * Mock para desenvolvimento local sem Twilio.
 * Armazena códigos em memória e loga no console.
 */
const codesByEmail = new Map<string, { code: string; expiresAt: number }>();

const CODE_EXPIRY_MS = 15 * 60 * 1000; // 15 min

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class MockVerificationService implements IVerificationService {
  async sendCode(email: string): Promise<void> {
    const code = generateCode();
    codesByEmail.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + CODE_EXPIRY_MS,
    });
    console.log(`📧 [MOCK] Código de verificação para ${email}: ${code}`);
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const stored = codesByEmail.get(email.toLowerCase());
    if (!stored) return false;
    if (Date.now() > stored.expiresAt) {
      codesByEmail.delete(email.toLowerCase());
      return false;
    }
    const isValid = stored.code === code;
    if (isValid) {
      codesByEmail.delete(email.toLowerCase());
    }
    return isValid;
  }
}
