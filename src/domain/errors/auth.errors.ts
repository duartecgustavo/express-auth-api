import { PasswordValidationError } from "../types/password.types";

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super("Email já esta em uso");
    this.name = "EmailAlreadyInUseError";
  }
}

export class WeakPasswordError extends Error {
  constructor(public readonly errors: PasswordValidationError[]) {
    super("Senha não atende aos requisitps de segurança");
    this.name = "WeakPasswordError";
  }
}

export class InvalidVerificationCodeError extends Error {
  constructor() {
    super("Código de verificação inválido ou expirado");
    this.name = "InvalidVerificationCodeError";
  }
}

export class PendingRegistrationNotFoundError extends Error {
  constructor() {
    super("Cadastro pendente não encontrado ou expirado. Faça o registro novamente.");
    this.name = "PendingRegistrationNotFoundError";
  }
}
