import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { NextFunction, Request, Response } from "express";

export function validateQuery(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToClass(dtoClass, req.query, {
      enableImplicitConversion: true,
    });

    const errors = await validate(dto as object);

    if (errors.length > 0) {
      const messages = errors
        .map((err) => Object.values(err.constraints || {}))
        .flat();

      return res.status(400).json({
        error: "Validation failed",
        messages,
      });
    }

    req.query = dto as any;
    next();
  };
}
