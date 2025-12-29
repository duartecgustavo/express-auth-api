import { Router } from "express";
import { authController } from "../controllers/dependency-injection-auth.di";
import { authMiddleware } from "../middlewares/auth";
import { validateParams } from "../middlewares/validateParams.middleware";
import { GetUserByIdDto } from "../application/dtos/get-user-by-id.dto";
import { validateQuery } from "../middlewares/validateQuery.middleware";
import { GetUsersDto } from "../application/dtos/get-users.dto";

const router = Router();

router.get("/list", authMiddleware, validateQuery(GetUsersDto), (req, res) =>
  authController.getUsers(req, res)
);

router.get("/:id", authMiddleware, validateParams(GetUserByIdDto), (req, res) =>
  authController.getUserById(req, res)
);

export { router as userRoutes };
