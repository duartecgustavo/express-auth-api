import { Request, Response, NextFunction } from "express";
import { validateDto } from "../../../../infrastructure/http/middlewares/validateDto.middleware";
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  Min,
} from "class-validator";

class ValidTestDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;
}

class OptionalFieldsDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;
}

class ComplexValidationDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  password: string;

  @IsInt()
  @Min(18, { message: "Age must be at least 18" })
  age: number;
}

describe("validateDto Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  describe("when validation is successful", () => {
    it("should validate correct body and call next()", async () => {
      mockReq.body = {
        email: "user@example.com",
        password: "StrongPass@123",
        name: "John Doe",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should replace req.body with validated DTO instance", async () => {
      const originalBody = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test User",
      };

      mockReq.body = originalBody;

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body).toBeInstanceOf(ValidTestDto);
      expect(mockReq.body.email).toBe("test@test.com");
      expect(mockReq.body.password).toBe("Password@123");
      expect(mockReq.body.name).toBe("Test User");
    });

    it("should transform plain object to DTO class instance", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body).toBeInstanceOf(ValidTestDto);
      expect(mockReq.body.constructor.name).toBe("ValidTestDto");
    });

    it("should work with absent optional fields", async () => {
      mockReq.body = {
        email: "test@test.com",
      };

      const middleware = validateDto(OptionalFieldsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.email).toBe("test@test.com");
      expect(mockReq.body.name).toBeUndefined();
    });

    it("should work with present optional fields", async () => {
      mockReq.body = {
        email: "test@test.com",
        name: "Optional Name",
      };

      const middleware = validateDto(OptionalFieldsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.name).toBe("Optional Name");
    });
  });

  describe("when validation fails", () => {
    it("should return 400 for invalid email", async () => {
      mockReq.body = {
        email: "invalid-email",
        password: "Password@123",
        name: "Test",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        messages: expect.arrayContaining([expect.stringContaining("email")]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 400 for password too short", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: "123",
        name: "Test",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        messages: expect.arrayContaining([expect.stringContaining("8")]),
      });
    });

    it("should return 400 for missing required field", async () => {
      mockReq.body = {
        email: "test@test.com",

        name: "Test",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        messages: expect.any(Array),
      });
    });

    it("should return 400 for wrong type", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: 12345678,
        name: "Test",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        messages: expect.arrayContaining([expect.stringContaining("string")]),
      });
    });

    it("should return multiple error messages", async () => {
      mockReq.body = {
        email: "invalid-email",
        password: "123",
        age: 15,
      };

      const middleware = validateDto(ComplexValidationDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        messages: expect.any(Array),
      });

      const response = jsonMock.mock.calls[0][0];
      expect(response.messages.length).toBeGreaterThan(1);
    });

    it("should return custom messages when defined", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: "123",
        age: 16,
      };

      const middleware = validateDto(ComplexValidationDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      expect(response.messages).toEqual(
        expect.arrayContaining([
          "Password must be at least 8 characters",
          "Age must be at least 18",
        ])
      );
    });
  });

  describe("data transformation", () => {
    it("should convert plain object to class instance", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body).toBeInstanceOf(ValidTestDto);
      expect(mockReq.body.constructor.name).toBe("ValidTestDto");
    });

    it("should preserve values after transformation", async () => {
      const bodyData = {
        email: "preserve@test.com",
        password: "PreservePass@123",
        name: "Preserve Name",
      };

      mockReq.body = { ...bodyData };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.email).toBe(bodyData.email);
      expect(mockReq.body.password).toBe(bodyData.password);
      expect(mockReq.body.name).toBe(bodyData.name);
    });

    it("should mutate req.body (not create new property)", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body).toBeInstanceOf(ValidTestDto);
      expect((mockReq as any).validatedBody).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should return 400 for empty body", async () => {
      mockReq.body = {};

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should ignore extra fields not defined in DTO", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test",
        extraField: "Should be ignored",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should work with different DTOs", async () => {
      const dtos = [
        {
          dto: ValidTestDto,
          body: {
            email: "test@test.com",
            password: "Password@123",
            name: "Test",
          },
        },
        {
          dto: OptionalFieldsDto,
          body: { email: "test@test.com", name: "Test" },
        },
        {
          dto: ComplexValidationDto,
          body: { email: "test@test.com", password: "Password@123", age: 25 },
        },
      ];

      for (const { dto: DtoClass, body } of dtos) {
        mockReq.body = body;
        mockNext = jest.fn();

        const middleware = validateDto(DtoClass);

        await middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.body).toBeInstanceOf(DtoClass);
        expect(mockNext).toHaveBeenCalled();
      }
    });

    it("should replace req.body reference completely", async () => {
      const originalBodyReference = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test",
      };

      mockReq.body = originalBodyReference;

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body).not.toBe(originalBodyReference);
      expect(mockReq.body).toBeInstanceOf(ValidTestDto);
    });
  });

  describe("security", () => {
    it("should not leak sensitive data in error messages", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: "123",
        name: "Test",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      expect(JSON.stringify(response.messages)).not.toContain("123");
    });

    it("should always return array of messages", async () => {
      mockReq.body = {
        email: "invalid",
        password: "short",
        name: "",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      expect(Array.isArray(response.messages)).toBe(true);
      expect(response.messages.length).toBeGreaterThan(0);
    });

    it("should process validation asynchronously", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test",
      };

      const middleware = validateDto(ValidTestDto);

      const result = middleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(result).toBeInstanceOf(Promise);
      await result;
    });
  });

  describe("error response structure", () => {
    it("should return consistent error structure", async () => {
      mockReq.body = {
        email: "invalid-email",
        password: "123",
        name: "Test",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      expect(response).toHaveProperty("error");
      expect(response).toHaveProperty("messages");
      expect(response.error).toBe("Validation failed");
      expect(Array.isArray(response.messages)).toBe(true);
    });

    it("should return readable error messages", async () => {
      mockReq.body = {
        email: "not-an-email",
        password: "short",
        name: "Test",
      };

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      response.messages.forEach((message: string) => {
        expect(typeof message).toBe("string");
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe("difference from validateBody", () => {
    it("should replace req.body instead of creating req.validatedBody", async () => {
      const originalBody = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test",
      };

      mockReq.body = originalBody;

      const middleware = validateDto(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body).toBeInstanceOf(ValidTestDto);

      expect((mockReq as any).validatedBody).toBeUndefined();
    });
  });
});
