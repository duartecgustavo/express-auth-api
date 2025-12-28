export class MailService {
  normalize(email: string): string {
    return email.toLocaleLowerCase().trim();
  }

  validate(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
