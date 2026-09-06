const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const pool = require("../db/pool");
const { signAccessToken } = require("../middleware/auth");

async function findUserByEmail(email) {
  const result = await pool.query(
    `
      SELECT id, full_name, email, password_hash, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await pool.query(
    `
      SELECT id, full_name, email, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function createUser({ fullName, email, password }) {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const error = new Error("A user with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = randomUUID();

  const result = await pool.query(
    `
      INSERT INTO users (id, full_name, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, created_at, updated_at
    `,
    [id, fullName || null, email, passwordHash]
  );

  const user = result.rows[0];

  return {
    user,
    token: signAccessToken(user)
  };
}

async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    token: signAccessToken(user)
  };
}

module.exports = {
  createUser,
  loginUser,
  findUserById
};
