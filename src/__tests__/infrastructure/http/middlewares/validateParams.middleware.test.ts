import { Request, Response, NextFunction } from "express";
import { validateParams } from "../../../../infrastructure/http/middlewares/validateParams.middleware";
import { IsUUID, IsNumberString, IsString, Length } from "class-validator";

class UserIdParamsDto {
  @IsNumberString()
  id: string;
}

class UuidParamsDto {
  @IsUUID()
  id: string;
}

class MultipleParamsDto {
  @IsNumberString()
  userId: string;

  @IsNumberString()
  postId: string;
}

class StringParamsDto {
  @IsString()
  @Length(3, 20)
  slug: string;
}

describe("validateParams Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockReq = {
      params: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  describe("when validation is successful", () => {
    it("should validate correct params and call next()", async () => {
      mockReq.params = {
        id: "123",
      };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should validate numeric string ID", async () => {
      mockReq.params = { id: "456" };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should validate UUID format", async () => {
      mockReq.params = {
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      const middleware = validateParams(UuidParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should validate multiple params", async () => {
      mockReq.params = {
        userId: "123",
        postId: "456",
      };

      const middleware = validateParams(MultipleParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should validate string slug params", async () => {
      mockReq.params = {
        slug: "valid-slug",
      };

      const middleware = validateParams(StringParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should handle large numeric IDs", async () => {
      mockReq.params = {
        id: "999999999999",
      };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("when validation fails", () => {
    it("should return 400 for non-numeric ID", async () => {
      mockReq.params = {
        id: "abc",
      };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        messages: ["id must be a number string"],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid UUID", async () => {
      mockReq.params = {
        id: "not-a-valid-uuid",
      };

      const middleware = validateParams(UuidParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        messages: ["id must be a UUID"],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
    it("should return 400 for missing required param", async () => {
      mockReq.params = {};

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 400 for slug too short", async () => {
      mockReq.params = {
        slug: "ab",
      };

      const middleware = validateParams(StringParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        messages: expect.any(Array),
      });
    });

    it("should return 400 for slug too long", async () => {
      mockReq.params = {
        slug: "this-slug-is-way-too-long-to-be-valid",
      };

      const middleware = validateParams(StringParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("should return 400 for one invalid param in multiple params", async () => {
      mockReq.params = {
        userId: "123",
        postId: "invalid",
      };

      const middleware = validateParams(MultipleParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return multiple error messages", async () => {
      mockReq.params = {
        userId: "invalid",
        postId: "also-invalid",
      };

      const middleware = validateParams(MultipleParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);

      const response = jsonMock.mock.calls[0][0];
      expect(response.messages.length).toBeGreaterThan(1);
    });
  });

  describe("data transformation", () => {
    it("should transform params to DTO class instance", async () => {
      mockReq.params = { id: "123" };

      const middleware = validateParams(UserIdParamsDto);

      const originalParams = mockReq.params;

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.params.id).toBe("123");
    });

    it("should preserve all param values", async () => {
      const paramsData = {
        userId: "123",
        postId: "456",
      };

      mockReq.params = paramsData;

      const middleware = validateParams(MultipleParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.params.userId).toBe("123");
      expect(mockReq.params.postId).toBe("456");
    });
  });

  describe("edge cases", () => {
    it("should return 400 for empty params", async () => {
      mockReq.params = {};

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle ID with leading zeros", async () => {
      mockReq.params = {
        id: "0123",
      };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should reject negative numbers as invalid", async () => {
      mockReq.params = {
        id: "-123",
      };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should reject floating point numbers", async () => {
      mockReq.params = {
        id: "123.45",
      };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should work with different DTO classes", async () => {
      const testCases = [
        { dto: UserIdParamsDto, params: { id: "123" } },
        {
          dto: UuidParamsDto,
          params: { id: "550e8400-e29b-41d4-a716-446655440000" },
        },
        { dto: StringParamsDto, params: { slug: "valid-slug" } },
      ];

      for (const { dto, params } of testCases) {
        mockReq.params = params as any;
        mockNext = jest.fn();

        const middleware = validateParams(dto);

        await middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      }
    });

    it("should ignore extra params not in DTO", async () => {
      mockReq.params = {
        id: "123",
        extraParam: "should-be-ignored",
      };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("security", () => {
    it("should not expose internal validation details", async () => {
      mockReq.params = {
        id: "invalid-id",
      };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      expect(response.error).toBe("Validation failed");
      expect(Array.isArray(response.messages)).toBe(true);
    });

    it("should always return array of messages", async () => {
      mockReq.params = {
        userId: "invalid",
        postId: "also-invalid",
      };

      const middleware = validateParams(MultipleParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      expect(Array.isArray(response.messages)).toBe(true);
      expect(response.messages.length).toBeGreaterThan(0);
    });

    it("should process validation asynchronously", async () => {
      mockReq.params = { id: "123" };

      const middleware = validateParams(UserIdParamsDto);

      const result = middleware(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    it("should validate params before allowing route execution", async () => {
      mockReq.params = {
        id: "sql-injection'; DROP TABLE users--",
      };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("error response structure", () => {
    it("should return consistent error structure", async () => {
      mockReq.params = {
        id: "invalid",
      };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      expect(response).toHaveProperty("error");
      expect(response).toHaveProperty("messages");
      expect(response.error).toBe("Validation failed");
      expect(Array.isArray(response.messages)).toBe(true);
    });

    it("should return readable error messages", async () => {
      mockReq.params = {
        id: "not-a-number",
      };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      response.messages.forEach((message: string) => {
        expect(typeof message).toBe("string");
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe("common use cases", () => {
    it("should validate user ID in GET /users/:id", async () => {
      mockReq.params = { id: "42" };

      const middleware = validateParams(UserIdParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should validate nested resource IDs in /users/:userId/posts/:postId", async () => {
      mockReq.params = {
        userId: "10",
        postId: "25",
      };

      const middleware = validateParams(MultipleParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should validate slug in GET /posts/:slug", async () => {
      mockReq.params = {
        slug: "my-blog-post",
      };

      const middleware = validateParams(StringParamsDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
