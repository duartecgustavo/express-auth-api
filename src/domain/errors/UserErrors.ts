export class EmailAlreadyInUseError extends Error {
  constructor() {
    super("Email já esta em uso");
    this.name = "EmailAlreadyInUseError";
  }
}

export class WeakPasswordError extends Error {
  constructor(public readonly errors: string[]) {
    super("Senha não atende aos requisitps de segurança");
    this.name = "WeakPasswordError";
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super("Usuário não encontrado");
    this.name = "UserNotFoundError";
  }
}
