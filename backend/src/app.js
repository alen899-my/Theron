const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./routes/auth.routes");
const scrapeRoutes = require("./routes/scrape.routes");
const { errorHandler } = require("./middleware/error-handler");
const env = require("./config/env");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
  })
);

const allowedOrigins = env.clientUrl
  ? [
      env.clientUrl.replace(/\/$/, ""),
      "http://localhost:5173",
      "http://localhost:4173",
      "http://localhost:3000"
    ]
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "maps-pipeline-backend",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/pipeline/maps", scrapeRoutes);

const path = require("path");
const fs = require("fs");
const frontendDist = path.join(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use(errorHandler);

module.exports = app;
