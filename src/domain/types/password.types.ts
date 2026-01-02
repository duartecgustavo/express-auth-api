export enum PasswordErrorCode {
  MIN_LENGTH = "PWD-001",
  UPPERCASE_REQUIRED = "PWD-002",
  LOWERCASE_REQUIRED = "PWD-003",
  NUMBER_REQUIRED = "PWD-004",
  SPECIAL_CHAR_REQUIRED = "PWD-005",
}

export interface PasswordValidationError {
  code: PasswordErrorCode;
  message: string;
}
