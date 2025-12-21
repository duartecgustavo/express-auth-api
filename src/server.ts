import { app } from "./app";
import { AppDataSource } from "./data-source";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log("🚀 Conexão com banco de dados estabelecida!");

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao conectar com o banco de dados:", error);
    process.exit(1);
  }
}

startServer();
