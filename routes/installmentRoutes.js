import express from 'express';
import pool from '../config/db.js';
import { verifyUser } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyUser);


router.get('/', async (req, res) => {
  try {
    const [installments] = await pool.query('SELECT * FROM installments WHERE user_id = ?', [req.userId]);
    res.json(installments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/', async (req, res) => {
  const { item_name, total_amount, monthly_amount, start_date } = req.body;
  try {
    await pool.query(
      'INSERT INTO installments (user_id, item_name, total_amount, monthly_amount, remaining_amount, start_date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, item_name, total_amount, monthly_amount, total_amount, start_date]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
