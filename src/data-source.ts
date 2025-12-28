import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./domain/entities/User";
import dotenv from "dotenv";

dotenv.config();

// Validar variável de ambiente
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is not defined in environment variables");
}

const isProduction = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,

  // ⚠️ NUNCA use synchronize: true em produção!
  synchronize: !isProduction,

  // Logging controlado por ambiente
  logging: process.env.DB_LOGGING === "true" || !isProduction,

  entities: [User],
  migrations: ["src/migrations/**/*.ts"],
  subscribers: [],

  // SSL configurável
  ssl: isProduction
    ? { rejectUnauthorized: true } //
    : false,

  // Configurações extras de performance
  extra: {
    max: 10,
    connectionTimeoutMillis: 3000,
  },
});
