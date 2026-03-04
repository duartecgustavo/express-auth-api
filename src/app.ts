import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import helmet from "helmet";
import "reflect-metadata";
import { AppDataSource } from "./infrastructure/database/data-source";
import { authRoutes } from "./infrastructure/http/routes/auth.routes";
import { userRoutes } from "./infrastructure/http/routes/users.routes";

dotenv.config();

const app = express();

// ===== INICIALIZAÇÃO DO BANCO (serverless/Vercel) =====
app.use(async (_req, _res, next) => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  } catch (err) {
    console.error("Database init error:", err);
  }
  next();
});

// ===== MIDDLEWARES DE SEGURANÇA =====
app.use(helmet());

const corsOrigins = [
  process.env.CORS_ORIGIN || "http://localhost:5173",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:3000",
  "https://auth-terminal.vercel.app",
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean) : []),
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (corsOrigins.includes(origin)) return cb(null, true);
      if (origin.endsWith(".vercel.app")) return cb(null, true); // preview deployments
      cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

// ===== ROTAS =====
app.get("/", (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.type("html").send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auth API</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f12 0%, #1a1a24 50%, #0f0f12 100%);
      color: #e4e4e7;
      font-family: 'Space Grotesk', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      background: linear-gradient(90deg, #00ff88, #00d4aa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .version {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #71717a;
      margin-bottom: 1.5rem;
    }
    .message {
      color: #a1a1aa;
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }
    .endpoints {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .endpoint {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: rgba(0,255,136,0.06);
      border: 1px solid rgba(0,255,136,0.15);
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
    }
    .endpoint span:first-child { color: #00ff88; }
    .endpoint a {
      color: #71717a;
      text-decoration: none;
      transition: color 0.2s;
    }
    .endpoint a:hover { color: #00ff88; }
    .footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255,255,255,0.06);
      font-size: 0.8rem;
      color: #52525b;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Auth API</h1>
    <p class="version">v1.0.0</p>
    <p class="message">API de autenticação com JWT, registro por email e gerenciamento de usuários.</p>
    <div class="endpoints">
      <div class="endpoint">
        <span>/auth</span>
        <a href="${baseUrl}/auth" target="_blank">${baseUrl}/auth</a>
      </div>
      <div class="endpoint">
        <span>/users</span>
        <a href="${baseUrl}/users" target="_blank">${baseUrl}/users</a>
      </div>
    </div>
    <p class="footer">Feito com ❤️ e TypeScript</p>
  </div>
</body>
</html>
  `);
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
export default app;
