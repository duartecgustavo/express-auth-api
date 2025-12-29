import { Router } from "express";
import { LoginUserDto } from "../application/dtos/login.dto";
import { RegisterUserDto } from "../application/dtos/register.dto";
import { authController } from "../controllers/dependency-injection-auth.di";
import { validateDto } from "../middlewares/validateDto.middleware";

const router = Router();

router.post("/register", validateDto(RegisterUserDto), (req, res) =>
  authController.register(req, res)
);

router.post("/login", validateDto(LoginUserDto), (req, res) =>
  authController.login(req, res)
);

export { router as authRoutes };
