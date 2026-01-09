import { Router } from 'express';
import pool from '../config/database.js';

const router = Router();

router.get('/db', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: rows[0].ok });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
});

export default router;
