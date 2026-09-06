const { initializeDatabase } = require("../db/init");
const pool = require("../db/pool");

async function run() {
  await initializeDatabase();
  console.log("[db] Schema initialized successfully");
  await pool.end();
}

run().catch(async (error) => {
  console.error("[db] Schema initialization failed", error);
  await pool.end().catch(() => {});
  process.exit(1);
});
