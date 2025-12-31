import { Router } from "express";
import { DeleteUserByIdDto } from "../application/dtos/delete-user.dto";
import { GetUserByIdDto } from "../application/dtos/get-user-by-id.dto";
import { GetUsersDto } from "../application/dtos/get-users.dto";
import { UpdateUserDto } from "../application/dtos/update-user.dto";
import { authController } from "../controllers/dependency-injection-auth.di";
import { authMiddleware } from "../middlewares/auth";
import { validateBody } from "../middlewares/validateBody.middleware";
import { validateParams } from "../middlewares/validateParams.middleware";
import { validateQuery } from "../middlewares/validateQuery.middleware";

const router = Router();

router.get("/list", authMiddleware, validateQuery(GetUsersDto), (req, res) =>
  authController.getUsers(req, res)
);

router.get("/:id", authMiddleware, validateParams(GetUserByIdDto), (req, res) =>
  authController.getUserById(req, res)
);

router.patch(
  "/:id",
  authMiddleware,
  validateParams(GetUserByIdDto),
  validateBody(UpdateUserDto),
  (req, res) => authController.updateUser(req, res)
);

router.delete("/:id", validateParams(DeleteUserByIdDto), (req, res) =>
  authController.deleteUser(req, res)
);

export { router as userRoutes };
