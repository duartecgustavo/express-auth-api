import { app } from "./app";
import { AppDataSource } from "./infrastructure/database/data-source";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup error:", error);
    process.exit(1);
  }
}

// Graceful shutdown básico
process.on("SIGTERM", async () => {
  console.log("⚠️  Shutting down...");
  await AppDataSource.destroy();
  process.exit(0);
});

startServer();
