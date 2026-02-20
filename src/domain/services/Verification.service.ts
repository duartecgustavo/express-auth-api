export interface IVerificationService {
  sendCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<boolean>;
}
