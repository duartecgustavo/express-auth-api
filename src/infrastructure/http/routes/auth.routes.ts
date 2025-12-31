import { Router } from "express";
import { validateDto } from "../middlewares/validateDto.middleware";
import { LoginUserDto } from "../../../application/dtos/auth/login.dto";
import { RegisterUserDto } from "../../../application/dtos/auth/register.dto";
import { authController } from "../../di/dependency-injection-auth.di";

const router = Router();

router.post("/register", validateDto(RegisterUserDto), (req, res) =>
  authController.register(req, res)
);

router.post("/login", validateDto(LoginUserDto), (req, res) =>
  authController.login(req, res)
);

export { router as authRoutes };
