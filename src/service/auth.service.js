// src/service/auth.service.js
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import db from "../config/database.js";

// ==========================
// CONSTANTS
// ==========================
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || "30d";

if (!process.env.JWT_ACCESS_SECRET) throw new Error("JWT_ACCESS_SECRET is not set");
if (!process.env.JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is not set");

// ==========================
// REGISTER USER
// ==========================
export async function registerUser({ tenant_name, store_name, name, email, password }) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const tenantId = uuid();
    const storeId = uuid();
    const userId = uuid();

    // Insert tenant & store
    await client.query(
      `INSERT INTO tenants (id, name) VALUES ($1, $2)`,
      [tenantId, tenant_name]
    );

    await client.query(
      `INSERT INTO stores (id, tenant_id, name) VALUES ($1, $2, $3)`,
      [storeId, tenantId, store_name]
    );

    // Hash password
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    await client.query(
      `INSERT INTO users (id, tenant_id, store_id, name, email, password_hash, role)
       VALUES ($1,$2,$3,$4,$5,$6,'owner')`,
      [userId, tenantId, storeId, name, email, passwordHash]
    );

    await client.query("COMMIT");

    // Generate tokens
    const accessToken = jwt.sign(
      { sub: userId, tenant_id: tenantId, store_id: storeId, role: "owner" },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES }
    );

    const refreshToken = jwt.sign(
      { sub: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRES }
    );

    return { accessToken, refreshToken };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ==========================
// LOGIN USER
// ==========================
export async function loginUser({ email, password }) {
  const { rows } = await db.query(
    `SELECT * FROM users WHERE email=$1 AND is_active=true`,
    [email]
  );

  if (!rows.length) throw new Error("Invalid credentials");

  const user = rows[0];

  const valid = await argon2.verify(user.password_hash, password);
  if (!valid) throw new Error("Invalid credentials");

  const accessToken = jwt.sign(
    { sub: user.id, tenant_id: user.tenant_id, store_id: user.store_id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );

  // 1️⃣ revoke semua refresh token user
  await db.query(
    "UPDATE refresh_tokens SET revoked=true WHERE user_id=$1",
    [user.id]
  );

  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );

  // 2️⃣ buat refresh token baru
  await db.query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
    VALUES ($1,$2,$3, now() + interval '30 days')`,
    [uuid(), user.id, refreshToken]
  );

  return { accessToken, refreshToken };
}

// ==========================
// REFRESH TOKEN
// ==========================
export async function refreshAccessToken(refreshToken) {
  if (!refreshToken) throw new Error("Refresh token is required");

  try {
    // 1️⃣ Verifikasi JWT
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 2️⃣ Cek user
    const { rows: userRows } = await db.query(
      "SELECT * FROM users WHERE id=$1 AND is_active=true",
      [payload.sub]
    );

    if (!userRows.length) throw new Error("User not found");
    const user = userRows[0];

    // 3️⃣ Cek refresh token di database (harus belum revoked)
    const { rows: tokenRows } = await db.query(
      "SELECT * FROM refresh_tokens WHERE user_id=$1 AND token_hash=$2 AND revoked=false AND expires_at >= now()",
      [user.id, refreshToken] // Bisa juga hash(refreshToken) jika disimpan hash
    );

    if (!tokenRows.length) {
      throw new Error("Refresh token is revoked or invalid");
    }

    // 4️⃣ Optional: revoke refresh token lama jika ingin single-use
    // await db.query(
    //   "UPDATE refresh_tokens SET revoked=true WHERE id=$1",
    //   [tokenRows[0].id]
    // );

    // 5️⃣ Buat access token baru
    const newAccessToken = jwt.sign(
      {
        sub: user.id,
        tenant_id: user.tenant_id,
        store_id: user.store_id,
        role: user.role
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_EXPIRES }
    );

    return { accessToken: newAccessToken };
  } catch (err) {
    throw new Error("Invalid or expired refresh token");
  }
}