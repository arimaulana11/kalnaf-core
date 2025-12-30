const { Pool } = require('pg');

let pool;

if (!pool) {
  pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    ssl: process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,

    // 🔥 SERVERLESS SAFE CONFIG
    max: 1,                 // jangan lebih dari 1
    idleTimeoutMillis: 1000,
    connectionTimeoutMillis: 3000,
    keepAlive: false
  });
}

module.exports = pool;
