const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/db', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: rows[0].ok });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
});

module.exports = router;
