import { Request, Response, NextFunction } from "express";
import { validateBody } from "../../../../infrastructure/http/middlewares/validateBody.middleware";
import { IsEmail, IsString, MinLength, IsOptional } from "class-validator";

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

  @IsString()
  @MinLength(3, { message: "Name must be at least 3 characters" })
  name: string;
}

describe("validateBody Middleware", () => {
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

      const middleware = validateBody(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should add validatedBody to request", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test User",
      };

      const middleware = validateBody(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.validatedBody).toBeDefined();
      expect(mockReq.validatedBody.email).toBe("test@test.com");
      expect(mockReq.validatedBody.password).toBe("Password@123");
      expect(mockReq.validatedBody.name).toBe("Test User");
    });

    it("should transform plain object to DTO class instance", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test",
      };

      const middleware = validateBody(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.validatedBody).toBeInstanceOf(ValidTestDto);
    });

    it("should work with absent optional fields", async () => {
      mockReq.body = {
        email: "test@test.com",
      };

      const middleware = validateBody(OptionalFieldsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedBody.email).toBe("test@test.com");
      expect(mockReq.validatedBody.name).toBeUndefined();
    });

    it("should work with present optional fields", async () => {
      mockReq.body = {
        email: "test@test.com",
        name: "Optional Name",
      };

      const middleware = validateBody(OptionalFieldsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedBody.name).toBe("Optional Name");
    });
  });

  describe("when validation fails", () => {
    it("should return 400 for invalid email", async () => {
      mockReq.body = {
        email: "invalid-email",
        password: "Password@123",
        name: "Test",
      };

      const middleware = validateBody(ValidTestDto);

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

      const middleware = validateBody(ValidTestDto);

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

      const middleware = validateBody(ValidTestDto);

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

      const middleware = validateBody(ValidTestDto);

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
        name: "AB",
      };

      const middleware = validateBody(ComplexValidationDto);

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
        name: "AB",
      };

      const middleware = validateBody(ComplexValidationDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      expect(response.messages).toEqual(
        expect.arrayContaining([
          "Password must be at least 8 characters",
          "Name must be at least 3 characters",
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

      const middleware = validateBody(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.validatedBody).toBeInstanceOf(ValidTestDto);
      expect(mockReq.validatedBody.constructor.name).toBe("ValidTestDto");
    });

    it("should preserve values after transformation", async () => {
      const bodyData = {
        email: "preserve@test.com",
        password: "PreservePass@123",
        name: "Preserve Name",
      };

      mockReq.body = bodyData;

      const middleware = validateBody(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.validatedBody.email).toBe(bodyData.email);
      expect(mockReq.validatedBody.password).toBe(bodyData.password);
      expect(mockReq.validatedBody.name).toBe(bodyData.name);
    });
  });

  describe("edge cases", () => {
    it("should return 400 for empty body", async () => {
      mockReq.body = {};

      const middleware = validateBody(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 400 for null body", async () => {
      mockReq.body = null;

      const middleware = validateBody(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 for undefined body", async () => {
      mockReq.body = undefined;

      const middleware = validateBody(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should ignore extra fields not defined in DTO", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test",
        extraField: "Should be ignored",
      };

      const middleware = validateBody(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should work with different DTOs", async () => {
      const dtos = [ValidTestDto, OptionalFieldsDto, ComplexValidationDto];

      for (const DtoClass of dtos) {
        mockReq.body = {
          email: "test@test.com",
          password: "Password@123",
          name: "Test User",
        };

        const middleware = validateBody(DtoClass);

        await middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.validatedBody).toBeInstanceOf(DtoClass);
      }
    });

    it("should not modify original req.body", async () => {
      const originalBody = {
        email: "test@test.com",
        password: "Password@123",
        name: "Test",
      };

      mockReq.body = { ...originalBody };

      const middleware = validateBody(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body).toEqual(originalBody);
    });
  });

  describe("security", () => {
    it("should not leak sensitive data in error messages", async () => {
      mockReq.body = {
        email: "test@test.com",
        password: "123",
        name: "Test",
      };

      const middleware = validateBody(ValidTestDto);

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

      const middleware = validateBody(ValidTestDto);

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

      const middleware = validateBody(ValidTestDto);

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

      const middleware = validateBody(ValidTestDto);

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

      const middleware = validateBody(ValidTestDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      response.messages.forEach((message: string) => {
        expect(typeof message).toBe("string");
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });
});
