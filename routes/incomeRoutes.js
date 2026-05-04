import express from 'express';
import pool from '../config/db.js';
import { verifyUser } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyUser);


router.get('/', async (req, res) => {
  try {
    const [income] = await pool.query('SELECT * FROM income WHERE user_id = ? ORDER BY date DESC', [req.userId]);
    res.json(income);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/', async (req, res) => {
  const { amount, source, date, description, payment_method_id } = req.body;
  try {

    await pool.query(
      'INSERT INTO income (user_id, amount, source, date, description, payment_method_id) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, amount, source, date, description, payment_method_id]
    );


    if (payment_method_id) {
      await pool.query(
        'UPDATE payment_methods SET balance = balance + ? WHERE id = ? AND user_id = ?',
        [amount, payment_method_id, req.userId]
      );
    }
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
