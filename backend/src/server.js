const app = require("./app");
const env = require("./config/env");
const { initializeDatabase } = require("./db/init");

const { ensureBrowserInstalled } = require("./utils/browser");

async function startServer() {
  await initializeDatabase();

  ensureBrowserInstalled().catch((err) => {
    console.warn("[backend] Browser pre-check:", err.message);
  });

  app.listen(env.port, "0.0.0.0", () => {
    console.log(`[backend] Listening on http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("[backend] Failed to start", error);
  process.exit(1);
});
