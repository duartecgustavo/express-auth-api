jest.mock("bcryptjs", () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

import bcrypt from "bcryptjs";
import { PasswordService } from "../../../domain/services/Password.service";
import { PasswordErrorCode } from "../../../domain/types/password.types";

describe("PasswordService class", () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
    jest.clearAllMocks();
  });

  describe("validate method", () => {
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

  describe("hash method", () => {
    it("must generate a different hash from the original password", async () => {
      const password = "Teste@01";

      (bcrypt.hash as jest.Mock).mockResolvedValue(
        "$2b$10$hashedpasswordexample"
      );

      const hash = await passwordService.hash(password);

      expect(hash).not.toBe(password);
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe("string");
    });

    it("must generate different hashes for the same password", async () => {
      const password = "Teste@01";

      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce("$2b$10$hash1")
        .mockResolvedValueOnce("$2b$10$hash2");

      const hash1 = await passwordService.hash(password);
      const hash2 = await passwordService.hash(password);

      expect(hash1).not.toBe(hash2);
    });

    it("must generate different hashes for different passwords", async () => {
      const password1 = "Teste@01";
      const password2 = "Etest@02";

      (bcrypt.hash as jest.Mock)
        .mockResolvedValueOnce("$2b$10$hash1")
        .mockResolvedValueOnce("$2b$10$hash2");

      const hash1 = await passwordService.hash(password1);
      const hash2 = await passwordService.hash(password2);

      expect(hash1).not.toBe(hash2);
    });

    it("must generate hash with bcrypt format", async () => {
      const password = "Teste@01";

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce("$2b$10$hash");

      const hash = await passwordService.hash(password);

      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it("must generate a hash when the password has special characters", async () => {
      const password = "!@#$%^&*()_+-=[]{}|;:',.<>?/`~AaBbCc123";

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce("$2b$10$hash");

      const hash = await passwordService.hash(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe("compare method", () => {
    it("must compare password with hashed password", async () => {
      const password = "Teste@01";

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce("$2b$10$hash");
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const hash = await passwordService.hash(password);

      const compare = await passwordService.compare(password, hash);

      expect(compare).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it("must reject incorrect password", async () => {
      const password = "Teste@01";
      const wrongPassword = "Etest@02";
      const fakeHash = "$2b$10$hash";

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(fakeHash);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const hash = await passwordService.hash(password);
      const compare = await passwordService.compare(wrongPassword, hash);

      expect(compare).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(wrongPassword, hash);
    });

    it("must be case sensitive", async () => {
      const password = "Teste@01";
      const invalidHash = "hash-invalido-sem-formato-bcrypt";

      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const result = await passwordService.compare(password, invalidHash);

      expect(result).toBe(false);
    });

    it("must correctly compare passwords with special characters", async () => {
      const password = "!@#$%^&*()_+-=[]{}|;:',.<>?/`~AaBbCc123";
      const hash = await passwordService.hash(password);

      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await passwordService.compare(password, hash);

      expect(result).toBe(true);
    });

    it("must validate the correct password among other passwords", async () => {
      const correctPassword = "SenhaCorreta@123";
      const fakeHash = "$2b$10$hash";

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(fakeHash);

      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(false) //
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const hash = await passwordService.hash(correctPassword);

      const passwords = [
        "SenhaErrada1@",
        "SenhaErrada2@",
        correctPassword,
        "SenhaErrada3@",
      ];

      const results = await Promise.all(
        passwords.map((pwd) => passwordService.compare(pwd, hash))
      );

      expect(results).toEqual([false, false, true, false]);
    });

    it("must compare correctly with a previously generated hash", async () => {
      const password = "SenhaForte@123";
      const fakeHash = "$2b$10$oldHash";

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(fakeHash);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const hash = await passwordService.hash(password);

      const result = await passwordService.compare(password, hash);

      expect(result).toBe(true);
    });

    it("must return true for multiple comparisons of the same password", async () => {
      const password = "SenhaForte@123";
      const fakeHash = "$2b$10$hash";

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(fakeHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const hash = await passwordService.hash(password);

      const result1 = await passwordService.compare(password, hash);
      const result2 = await passwordService.compare(password, hash);
      const result3 = await passwordService.compare(password, hash);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);

      expect(bcrypt.compare).toHaveBeenCalledTimes(3);
    });
  });
});
