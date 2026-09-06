const app = require("./app");
const env = require("./config/env");
const { initializeDatabase } = require("./db/init");

async function startServer() {
  await initializeDatabase();

  app.listen(env.port, "0.0.0.0", () => {
    console.log(`[backend] Listening on http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("[backend] Failed to start", error);
  process.exit(1);
});
