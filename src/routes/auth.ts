import { Router } from "express";
import { loginUsers, registerUsers } from "../controllers/userController";

const router = Router();

router.post("/registerUser", registerUsers);
router.post("/loginUser", loginUsers);

export { router as authRoutes };
