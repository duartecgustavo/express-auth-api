import dotenv from "dotenv";
import express, { Request, Response } from "express";
import "reflect-metadata";
import cors from "cors";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";

dotenv.config();

const app = express();

// ✅ habilita o CORS antes das rotas
app.use(
  cors({
    origin: "*", // permite todas as origens — use com cautela
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// rotas
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the User API");
});

export { app };
