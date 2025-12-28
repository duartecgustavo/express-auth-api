import { Router } from "express";
import { LoginUserDto } from "../dtos/login.dto";
import { RegisterUserDto } from "../dtos/register.dto";
import { authController } from "../infra/dependency-injection-container";
import { validateDto } from "../middlewares/validateDto";

const router = Router();

router.post("/register", validateDto(RegisterUserDto), (req, res) =>
  authController.register(req, res)
);

router.post("/login", validateDto(LoginUserDto), (req, res) =>
  authController.login(req, res)
);

export { router as authRoutes };
