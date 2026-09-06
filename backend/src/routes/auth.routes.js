const express = require("express");
const { createUser, loginUser, findUserById } = require("../services/auth-service");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function readAuthPayload(body) {
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  return { fullName, email, password };
}

router.post("/signup", async (req, res, next) => {
  try {
    const payload = readAuthPayload(req.body || {});

    if (!payload.email || !payload.password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    if (payload.password.length < 8) {
      return res.status(400).json({ error: "password must be at least 8 characters" });
    }

    const result = await createUser(payload);
    return res.status(201).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const payload = readAuthPayload(req.body || {});

    if (!payload.email || !payload.password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const result = await loginUser(payload);
    return res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.auth.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
