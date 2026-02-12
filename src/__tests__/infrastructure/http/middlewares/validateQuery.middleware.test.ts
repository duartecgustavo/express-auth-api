import "reflect-metadata";

import { Request, Response, NextFunction } from "express";
import { validateQuery } from "../../../../infrastructure/http/middlewares/validateQuery.middleware";
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { Transform } from "class-transformer";

class PaginationQueryDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

class SearchQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(["name", "email", "createdAt"])
  sortBy?: "name" | "email" | "createdAt";

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  order?: "ASC" | "DESC";
}

class FilterQueryDto {
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsInt()
  @Min(0)
  minAge?: number;
}

class ComplexQueryDto {
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number;

  @IsOptional()
  @IsString()
  search?: string;
}

describe("validateQuery Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockReq = {
      query: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  describe("when validation is successful", () => {
    it("should validate correct query and call next()", async () => {
      mockReq.query = {
        page: "1",
        limit: "10",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it("should add validatedQuery to request", async () => {
      mockReq.query = {
        page: "2",
        limit: "20",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.validatedQuery).toBeDefined();
      expect(mockReq.validatedQuery.page).toBe(2);
      expect(mockReq.validatedQuery.limit).toBe(20);
    });

    it("should convert string numbers to integers", async () => {
      mockReq.query = {
        page: "5",
        limit: "50",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(typeof mockReq.validatedQuery.page).toBe("number");
      expect(typeof mockReq.validatedQuery.limit).toBe("number");
      expect(mockReq.validatedQuery.page).toBe(5);
      expect(mockReq.validatedQuery.limit).toBe(50);
    });

    it("should convert string booleans to booleans", async () => {
      mockReq.query = {
        isActive: "true",
      };

      const middleware = validateQuery(FilterQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(typeof mockReq.validatedQuery.isActive).toBe("boolean");
      expect(mockReq.validatedQuery.isActive).toBe(true);
    });

    it("should work with optional fields absent", async () => {
      mockReq.query = {};

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedQuery.page).toBeUndefined();
      expect(mockReq.validatedQuery.limit).toBeUndefined();
    });

    it("should work with optional fields present", async () => {
      mockReq.query = {
        page: "1",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedQuery.page).toBe(1);
      expect(mockReq.validatedQuery.limit).toBeUndefined();
    });

    it("should validate search query parameters", async () => {
      mockReq.query = {
        search: "john doe",
        sortBy: "name",
        order: "ASC",
      };

      const middleware = validateQuery(SearchQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedQuery.search).toBe("john doe");
      expect(mockReq.validatedQuery.sortBy).toBe("name");
      expect(mockReq.validatedQuery.order).toBe("ASC");
    });

    it("should transform plain object to DTO class instance", async () => {
      mockReq.query = {
        page: "1",
        limit: "10",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.validatedQuery).toBeInstanceOf(PaginationQueryDto);
    });
  });

  describe("when validation fails", () => {
    it("should return 400 for page less than 1", async () => {
      mockReq.query = {
        page: "0",
        limit: "10",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        messages: expect.arrayContaining([expect.stringContaining("page")]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 400 for limit greater than 100", async () => {
      mockReq.query = {
        page: "1",
        limit: "200",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        messages: expect.arrayContaining([expect.stringContaining("limit")]),
      });
    });

    it("should return 400 for non-numeric page", async () => {
      mockReq.query = {
        page: "abc",
        limit: "10",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid enum value", async () => {
      mockReq.query = {
        sortBy: "invalid-field",
      };

      const middleware = validateQuery(SearchQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Validation failed",
        messages: expect.arrayContaining([expect.stringContaining("sortBy")]),
      });
    });

    it("should return 400 for missing required field", async () => {
      mockReq.query = {
        limit: "10",
      };

      const middleware = validateQuery(ComplexQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return multiple error messages", async () => {
      mockReq.query = {
        page: "0",
        limit: "200",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);

      const response = jsonMock.mock.calls[0][0];
      expect(response.messages.length).toBeGreaterThan(1);
    });
  });

  describe("data transformation", () => {
    it("should enable implicit conversion for query strings", async () => {
      mockReq.query = {
        page: "3",
        limit: "30",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.validatedQuery.page).toBe(3);
      expect(mockReq.validatedQuery.limit).toBe(30);
    });

    it("should preserve original req.query", async () => {
      const originalQuery = {
        page: "1",
        limit: "10",
      };

      mockReq.query = { ...originalQuery };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query).toEqual(originalQuery);
      expect(mockReq.validatedQuery).toBeDefined();
      expect(mockReq.validatedQuery).not.toBe(mockReq.query);
    });

    it("should convert 'true' string to boolean true", async () => {
      mockReq.query = {
        isActive: "true",
      } as any;

      const middleware = validateQuery(FilterQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.validatedQuery.isActive).toBe(true);
    });

    it("should handle boolean query parameters", async () => {
      mockReq.query = {
        isActive: "true",
      } as any;

      const middleware = validateQuery(FilterQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(typeof mockReq.validatedQuery.isActive).toBe("boolean");
      expect(mockReq.validatedQuery.isActive).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should work with empty query", async () => {
      mockReq.query = {};

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should ignore extra query parameters not in DTO", async () => {
      mockReq.query = {
        page: "1",
        limit: "10",
        extraParam: "should-be-ignored",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should work with different DTOs", async () => {
      mockReq.query = { page: "1", limit: "10" };
      let middleware = validateQuery(PaginationQueryDto);
      mockNext = jest.fn();
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockReq.validatedQuery).toBeInstanceOf(PaginationQueryDto);

      mockReq.query = { search: "test", sortBy: "name" };
      middleware = validateQuery(SearchQueryDto);
      mockNext = jest.fn();
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockReq.validatedQuery).toBeInstanceOf(SearchQueryDto);

      mockReq.query = { isActive: "true", minAge: "18" };
      middleware = validateQuery(FilterQueryDto);
      mockNext = jest.fn();
      await middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockReq.validatedQuery).toBeInstanceOf(FilterQueryDto);
    });

    it("should handle special characters in search query", async () => {
      mockReq.query = {
        search: "john@example.com",
      };

      const middleware = validateQuery(SearchQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedQuery.search).toBe("john@example.com");
    });

    it("should handle URL encoded values", async () => {
      mockReq.query = {
        search: "hello%20world",
      };

      const middleware = validateQuery(SearchQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("security", () => {
    it("should validate to prevent SQL injection in search", async () => {
      mockReq.query = {
        search: "'; DROP TABLE users--",
      };

      const middleware = validateQuery(SearchQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedQuery.search).toBe("'; DROP TABLE users--");
    });

    it("should always return array of messages", async () => {
      mockReq.query = {
        page: "invalid",
        limit: "invalid",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      expect(Array.isArray(response.messages)).toBe(true);
      expect(response.messages.length).toBeGreaterThan(0);
    });

    it("should process validation asynchronously", async () => {
      mockReq.query = {
        page: "1",
        limit: "10",
      };

      const middleware = validateQuery(PaginationQueryDto);

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
      mockReq.query = {
        page: "0",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      expect(response).toHaveProperty("error");
      expect(response).toHaveProperty("messages");
      expect(response.error).toBe("Validation failed");
      expect(Array.isArray(response.messages)).toBe(true);
    });

    it("should return readable error messages", async () => {
      mockReq.query = {
        page: "abc",
        limit: "xyz",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      response.messages.forEach((message: string) => {
        expect(typeof message).toBe("string");
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });

  describe("common use cases", () => {
    it("should validate pagination in GET /users?page=1&limit=10", async () => {
      mockReq.query = {
        page: "1",
        limit: "10",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedQuery.page).toBe(1);
      expect(mockReq.validatedQuery.limit).toBe(10);
    });

    it("should validate search with sorting in GET /users?search=john&sortBy=name&order=ASC", async () => {
      mockReq.query = {
        search: "john",
        sortBy: "name",
        order: "ASC",
      };

      const middleware = validateQuery(SearchQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedQuery.search).toBe("john");
      expect(mockReq.validatedQuery.sortBy).toBe("name");
      expect(mockReq.validatedQuery.order).toBe("ASC");
    });

    it("should validate filters in GET /users?isActive=true&minAge=18", async () => {
      mockReq.query = {
        isActive: "true",
        minAge: "18",
      };

      const middleware = validateQuery(FilterQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validatedQuery.isActive).toBe(true);
      expect(mockReq.validatedQuery.minAge).toBe(18);
    });
  });

  describe("difference from other middlewares", () => {
    it("should store in req.validatedQuery instead of req.body", async () => {
      mockReq.query = {
        page: "1",
        limit: "10",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.validatedQuery).toBeDefined();
      expect((mockReq as any).validatedBody).toBeUndefined();
    });

    it("should enable implicit conversion for query strings", async () => {
      mockReq.query = {
        page: "5",
      };

      const middleware = validateQuery(PaginationQueryDto);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(typeof mockReq.validatedQuery.page).toBe("number");
    });
  });
});
