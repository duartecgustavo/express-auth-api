import bcrypt from "bcryptjs";
import {
  PasswordErrorCode,
  PasswordValidationError,
} from "../types/password.types";

export class PasswordService {
  private saltRounds = 10;

  // Método de criacão da hash da senha
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  // Método de compraração da senha
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Método de validação da senha
  validate(password: string): {
    isValid: boolean;
    errors: PasswordValidationError[];
  } {
    const errors: PasswordValidationError[] = [];

    if (password.length < 8) {
      errors.push({
        code: PasswordErrorCode.MIN_LENGTH,
        message: "Senha deve ter no mínimo 8 caracteres",
      });
    }

    if (!/[A-Z]/.test(password)) {
      errors.push({
        code: PasswordErrorCode.UPPERCASE_REQUIRED,
        message: "Senha deve conter letra maiúscula",
      });
    }

    if (!/[a-z]/.test(password)) {
      errors.push({
        code: PasswordErrorCode.LOWERCASE_REQUIRED,
        message: "Senha deve conter letra minúscula",
      });
    }

    if (!/\d/.test(password)) {
      errors.push({
        code: PasswordErrorCode.NUMBER_REQUIRED,
        message: "Senha deve conter números",
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push({
        code: PasswordErrorCode.SPECIAL_CHAR_REQUIRED,
        message: "Senha deve conter caractere especial",
      });
    }

    return { isValid: errors.length === 0, errors };
  }
}
