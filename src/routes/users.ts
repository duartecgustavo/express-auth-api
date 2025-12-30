import { Router } from "express";
import { deleteUser } from "../controllers/AuthController.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.delete("/removeUser/:id", authMiddleware, deleteUser);

export { router as userRoutes };
