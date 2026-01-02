import { PasswordService } from "../../../domain/services/Password.service";
import { PasswordErrorCode } from "../../../domain/types/password.types";

describe("PasswordService", () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe("validate", () => {
    it("must acept a strong password", () => {
      const password = "StrongPass@123";

      const validate = passwordService.validate(password);

      expect(validate.isValid).toBe(true);
      expect(validate.errors).toHaveLength(0);
    });

    it("must reject a password with less than 8 characters", () => {
      const password = "Abc@1";

      const validate = passwordService.validate(password);

      expect(validate.isValid).toBe(false);
      expect(
        validate.errors.some((e) => e.code === PasswordErrorCode.MIN_LENGTH)
      );
    });
    it("must reject a password with only lowercase letters", () => {
      const password = "lowercasepass@123";

      const validate = passwordService.validate(password);

      expect(validate.isValid).toBe(false);
      expect(
        validate.errors.some(
          (e) => e.code === PasswordErrorCode.UPPERCASE_REQUIRED
        )
      );
    });
    it("must reject a password with only uppercase letters ", () => {
      const password = "UPPERCASEPASS@123";

      const validate = passwordService.validate(password);

      expect(validate.isValid).toBe(false);
      expect(
        validate.errors.some(
          (e) => e.code === PasswordErrorCode.LOWERCASE_REQUIRED
        )
      );
    });
    it("must reject a password without numbers", () => {
      const password = "Password@abc";

      const validate = passwordService.validate(password);

      expect(validate.isValid).toBe(false);
      expect(
        validate.errors.some(
          (e) => e.code === PasswordErrorCode.NUMBER_REQUIRED
        )
      );
    });
    it("must reject a password without special characters", () => {
      const password = "Abc123Password";

      const validate = passwordService.validate(password);

      expect(validate.isValid).toBe(false);
      expect(
        validate.errors.some(
          (e) => e.code === PasswordErrorCode.SPECIAL_CHAR_REQUIRED
        )
      );
    });
    it("must reject a very week password with all the erros", () => {
      const password = "";

      const validate = passwordService.validate(password);

      expect(validate.isValid).toBe(false);
      expect(validate.errors).toHaveLength(5);
      expect(
        validate.errors.some((e) => e.code === PasswordErrorCode.MIN_LENGTH)
      );
      expect(
        validate.errors.some(
          (e) => e.code === PasswordErrorCode.UPPERCASE_REQUIRED
        )
      );
      expect(
        validate.errors.some(
          (e) => e.code === PasswordErrorCode.LOWERCASE_REQUIRED
        )
      );
      expect(
        validate.errors.some(
          (e) => e.code === PasswordErrorCode.NUMBER_REQUIRED
        )
      );
      expect(
        validate.errors.some(
          (e) => e.code === PasswordErrorCode.SPECIAL_CHAR_REQUIRED
        )
      );
    });
  });
});
