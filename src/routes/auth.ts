import { Router } from "express";
import { loginUsers } from "../controllers/userController";
import { RegisterUserDto } from "../dtos/register.dto";
import { userController } from "../infra/dependency-injection-container";
import { validateDto } from "../middlewares/validateDto";

const router = Router();

router.post("/register", validateDto(RegisterUserDto), (req, res) =>
  userController.register(req, res)
);

router.post("/loginUser", loginUsers);

export { router as authRoutes };
