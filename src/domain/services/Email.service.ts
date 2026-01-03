import { EmailErrorCode, EmailValidationError } from "../types/email.types";

export class MailService {
  normalize(email: string): string {
    return email.toLowerCase().replace(/\s+/g, "");
  }

  validate(email: string): EmailValidationError {
    if (!email || email.trim() === "") {
      return {
        isValid: false,
        error: {
          code: EmailErrorCode.EMPTY_EMAIL,
          message: "Email não pode estar vazio",
        },
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        error: {
          code: EmailErrorCode.INVALID_FORMAT,
          message: "Formato de email inválido",
        },
      };
    }

    return { isValid: true };
  }
}
