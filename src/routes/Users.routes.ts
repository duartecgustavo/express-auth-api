import { Router } from "express";
import { authController } from "../controllers/dependency-injection-auth.di";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/list", authMiddleware, (req, res) =>
  authController.getUsers(req, res)
);

export { router as userRoutes };
