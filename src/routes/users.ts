import { Router } from "express";
import {
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
} from "../controllers/AuthController.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/getAll", authMiddleware, getUsers);

router.get("/getUserById/:id", authMiddleware, getUserById);

router.put("/updateUser/:id", authMiddleware, updateUser);

router.delete("/removeUser/:id", authMiddleware, deleteUser);

export { router as userRoutes };
