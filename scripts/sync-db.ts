/**
 * Sincroniza o schema do banco (cria tabelas user e pending_registration).
 * Execute uma vez contra o banco de produção: npm run db:sync
 */
import dotenv from "dotenv";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../src/domain/entities/User.entity";
import { PendingRegistration } from "../src/domain/entities/PendingRegistration.entity";

dotenv.config();

async function sync() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não definida");
  }

  const ds = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: true,
    entities: [User, PendingRegistration],
    ssl: { rejectUnauthorized: true },
  });

  await ds.initialize();
  console.log("✅ Tabelas sincronizadas (user, pending_registration).");
  await ds.destroy();
}

sync().catch((e) => {
  console.error("❌ Erro:", e.message);
  process.exit(1);
});
