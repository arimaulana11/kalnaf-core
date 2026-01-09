// src/controllers/auth.controller.js
import { loginUser, registerUser, refreshAccessToken } from "../service/auth.service.js";

// ==========================
// REGISTER
// ==========================
export async function register(req, res) {
  try {
    const { tenant_name, store_name, name, email, password } = req.body;

    const { accessToken, refreshToken } = await registerUser({
      tenant_name,
      store_name,
      name,
      email,
      password,
    });

    // Set refresh token di cookie
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
    });

    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "error", message: err.message });
  }
}

// ==========================
// LOGIN
// ==========================
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const { accessToken, refreshToken } = await loginUser({ email, password });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
    });

    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: "error", message: err.message });
  }
}

// ==========================
// REFRESH TOKEN
// ==========================
export async function refresh(req, res) {
  try {
    const refreshToken = req.cookies.refresh_token;    
    if (!refreshToken) throw new Error("Refresh token not found");

    const { accessToken } = await refreshAccessToken(refreshToken);

    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ status: "error", message: err.message });
  }
}
