import bcrypt from "bcryptjs";

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
  validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Senha deve ter no mínimo 8 caracteres");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Senha deve conter letra maiúscula");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Senha deve conter letra minúscula");
    }

    if (!/\d/.test(password)) {
      errors.push("Senha deve conter números");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Senha deve conter caractere especial");
    }

    return { isValid: errors.length === 0, errors };
  }
}
