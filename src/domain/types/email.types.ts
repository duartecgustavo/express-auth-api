export enum EmailErrorCode {
  INVALID_FORMAT = "EMAIL-001",
  EMPTY_EMAIL = "EMAIL-002",
}

export interface EmailValidationError {
  isValid?: boolean;
  error?: {
    code: EmailErrorCode;
    message: string;
  };
}
