// ==========================
// ENV & EXPRESS INIT
// ==========================
import 'dotenv/config';       // load dotenv paling atas

import express from "express";
import cookieParser from "cookie-parser";

const app = express();

// ==========================
// Body Parser
// ==========================
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ==========================
// Cookie Parser
// ==========================
app.use(cookieParser());

// ==========================
// Custom Middlewares
// ==========================
import cors from "./middlewares/cors.js";
import requestId from "./middlewares/requestId.js";
import logger from "./middlewares/logger.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import basicToken from "./middlewares/basicToken.js";

// ==========================
// Global middleware
// ==========================
app.use(cors);
app.use(requestId);
app.use(logger);

// ==========================
// Routes
// ==========================
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import healthRoutes from "./routes/health.js";

// Health check
app.use("/health", healthRoutes);

// AUTH routes (tanpa basicToken)
app.use("/api/auth", authRoutes);

// PRODUCT routes (pakai basicToken)
app.use("/api/products", basicToken, productRoutes);


// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "API LIVE",
    requestId: req.requestId || null,
  });
});

// ==========================
// Error Handling
// ==========================
app.use(notFound);
app.use(errorHandler);

// ==========================
// EXPORT APP (ES Module)
// ==========================
export default app;
