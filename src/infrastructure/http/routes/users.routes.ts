import { Router } from "express";
import { DeleteUserByIdDto } from "../../../application/dtos/users/delete-user.dto";
import { GetUserByIdDto } from "../../../application/dtos/users/get-user-by-id.dto";
import { GetUsersDto } from "../../../application/dtos/users/get-users.dto";
import { UpdateUserDto } from "../../../application/dtos/users/update-user.dto";
import { userController } from "../../di/dependency-injection-auth.di";
import { authMiddleware } from "../middlewares/auth";
import { validateBody } from "../middlewares/validateBody.middleware";
import { validateParams } from "../middlewares/validateParams.middleware";
import { validateQuery } from "../middlewares/validateQuery.middleware";

const router = Router();

router.get("/list", authMiddleware, validateQuery(GetUsersDto), (req, res) =>
  userController.getUsers(req, res)
);

router.get("/:id", authMiddleware, validateParams(GetUserByIdDto), (req, res) =>
  userController.getUserById(req, res)
);

router.patch(
  "/:id",
  authMiddleware,
  validateParams(GetUserByIdDto),
  validateBody(UpdateUserDto),
  (req, res) => userController.updateUser(req, res)
);

router.delete("/:id", validateParams(DeleteUserByIdDto), (req, res) =>
  userController.deleteUser(req, res)
);

export { router as userRoutes };
