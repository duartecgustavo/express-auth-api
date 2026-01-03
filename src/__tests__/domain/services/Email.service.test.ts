import { MailService } from "../../../domain/services/Email.service";
import { EmailErrorCode } from "../../../domain/types/email.types";

describe("EmailService class", () => {
  let emailService: MailService;

  beforeEach(() => {
    emailService = new MailService();
  });

  describe("normalize method", () => {
    it("must remove whitespace from email", () => {
      const email = "  usuario @exemplo . com ";

      const normalize = emailService.normalize(email);

      expect(normalize).toBe("usuario@exemplo.com");
    });

    it("must trasnform uppercase letters into lowercase", () => {
      const email = "USUARIO@exemplo.COM";

      const normalize = emailService.normalize(email);

      expect(normalize).toBe("usuario@exemplo.com");
    });

    it("must transform uppercase letters into lowercase and remove whitespaces from email", () => {
      const email = " USUARIO @e xemplo. COM  ";

      const normalize = emailService.normalize(email);

      expect(normalize).toBe("usuario@exemplo.com");
    });
  });

  describe("validate method", () => {
    it("must accept a valid email", () => {
      const email = "usuario@exemplo.com";

      const validate = emailService.validate(email);

      expect(validate.isValid).toBe(true);
      expect(validate.error).toBeUndefined();
    });

    it("must accpet email with numbes and simbols", () => {
      const email = "usuario123@exemplo-test.com";

      const result = emailService.validate(email);

      expect(result.isValid).toBe(true);
    });

    it("must accept email with subdomain", () => {
      const email = "usuario@mail.exemplo.com.br";

      const result = emailService.validate(email);

      expect(result.isValid).toBe(true);
    });

    it("must reject empty email", () => {
      const email = "";

      const result = emailService.validate(email);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(EmailErrorCode.EMPTY_EMAIL);
    });

    it("must reject just whitespace email", () => {
      const email = "   ";

      const result = emailService.validate(email);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(EmailErrorCode.EMPTY_EMAIL);
    });

    it("must reject just whitespace email", () => {
      const email = "usuario.test.com";

      const result = emailService.validate(email);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(EmailErrorCode.INVALID_FORMAT);
    });

    it("must reject email without domain", () => {
      const email = "usuario@";

      const result = emailService.validate(email);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(EmailErrorCode.INVALID_FORMAT);
    });

    it("must reject email without user", () => {
      const email = "@test.com";

      const result = emailService.validate(email);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(EmailErrorCode.INVALID_FORMAT);
    });

    it("must reject email with spaces", () => {
      const email = "usua rio@test.com";

      const result = emailService.validate(email);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe(EmailErrorCode.INVALID_FORMAT);
    });


  });
});
