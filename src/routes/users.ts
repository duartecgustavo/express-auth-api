import { Router } from "express";
import {
  findAllUsers,
  getUserById,
  removeUser,
  updateUser,
} from "../controllers/userController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/getAll", authMiddleware, findAllUsers);

router.get("/getUserById/:id", authMiddleware, getUserById);

router.put("/updateUser/:id", authMiddleware, updateUser);

router.delete("/removeUser/:id", authMiddleware, removeUser);

export { router as userRoutes };
