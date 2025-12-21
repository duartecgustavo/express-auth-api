import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: true, // Em produção, use migrations
  logging: true, // Ativando logging para debug
  entities: [User],
  migrations: [],
  subscribers: [],
  ssl: {
    rejectUnauthorized: false
  }
});