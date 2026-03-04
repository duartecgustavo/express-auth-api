const { app } = require("../dist/app");
const { AppDataSource } = require("../dist/infrastructure/database/data-source");

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await AppDataSource.initialize();
    dbInitialized = true;
  }
}

module.exports = async (req, res) => {
  try {
    await ensureDb();
  } catch (err) {
    console.error("Database init error:", err);
    return res.status(500).json({ error: "Database connection failed" });
  }
  return app(req, res);
};
