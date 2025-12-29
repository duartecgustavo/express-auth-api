import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import helmet from "helmet";
import "reflect-metadata";
import { authRoutes } from "./routes/Auth.routes";
import { userRoutes } from "./routes/Users.routes";

dotenv.config();

const app = express();

// ===== MIDDLEWARES DE SEGURANÇA =====
app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

// ===== ROTAS =====
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to the Auth API",
    version: "1.0.0",
    endpoints: {
      auth: "/auth",
      users: "/users",
    },
  });
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// ===== TRATAMENTO DE ERROS =====

// Rota não encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

export { app };
