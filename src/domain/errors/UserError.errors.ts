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
