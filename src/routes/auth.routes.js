// ==========================
// auth.routes.js
// ==========================
import { Router } from "express";
import * as controller from "../controllers/auth.controller.js"; // import semua fungsi

const router = Router();

// Routes
router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/refresh", controller.refresh); // pastikan refresh ada di controller

export default router;
