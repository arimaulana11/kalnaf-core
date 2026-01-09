import dotenv from "dotenv";
dotenv.config(); // HARUS DI SINI, paling atas

import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});