export class InvalidCredentialsError extends Error {
  constructor() {
    super("Email ou senha incorretos");
    this.name = "InvalidCredentialsError";
  }
}

export class UserNotConfirmedError extends Error {
  constructor() {
    super("Email não confirmado. Verifique sua caixa de entrada");
    this.name = "UserNotConfirmedError";
  }
}

export class UserNotFoundError extends Error {
  constructor(id?: string) {
    super(
      id ? `Usuário com ID ${id} não encontrado` : "Usuário não encontrado"
    );
    this.name = "UserNotFoundError";
  }
}
