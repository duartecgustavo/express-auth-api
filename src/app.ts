import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import helmet from "helmet";
import "reflect-metadata";
import { authRoutes } from "./infrastructure/http/routes/auth.routes";
import { userRoutes } from "./infrastructure/http/routes/users.routes";

dotenv.config();

const app = express();

// ===== MIDDLEWARES DE SEGURANÇA =====
app.use(helmet());

app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN || "http://localhost:5173",
      "http://localhost:8000",
      "http://127.0.0.1:8000",
      "http://localhost:3000",
      ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean) : []),
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
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
