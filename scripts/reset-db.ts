/**
 * Reseta as tabelas user e pending_registration.
 * Útil quando o schema mudou e o sync falha por dados antigos.
 * Uso: npx ts-node scripts/reset-db.ts
 */
import dotenv from "dotenv";
import { DataSource } from "typeorm";

dotenv.config();

async function reset() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não definida");
  }

  const ds = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
  });

  await ds.initialize();

  try {
    await ds.query('DROP TABLE IF EXISTS "pending_registration" CASCADE');
    await ds.query('DROP TABLE IF EXISTS "user" CASCADE');
    console.log("✅ Tabelas user e pending_registration removidas.");
  } finally {
    await ds.destroy();
  }
}

reset().catch((e) => {
  console.error("❌ Erro:", e.message);
  process.exit(1);
});
