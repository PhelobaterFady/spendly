import express from 'express';
import pool from '../config/db.js';
import { verifyUser } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyUser);


router.get('/', async (req, res) => {
  try {
    const [goals] = await pool.query('SELECT * FROM savings_goals WHERE user_id = ?', [req.userId]);
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/', async (req, res) => {
  const { name, target_amount } = req.body;
  try {
    await pool.query(
      'INSERT INTO savings_goals (user_id, name, target_amount) VALUES (?, ?, ?)',
      [req.userId, name, target_amount]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.patch('/:id', async (req, res) => {
  const { amount, wallet_id } = req.body;
  const { id } = req.params;
  try {

    await pool.query(
      'UPDATE savings_goals SET current_amount = current_amount + ? WHERE id = ? AND user_id = ?',
      [amount, id, req.userId]
    );
    

    if (wallet_id) {
      await pool.query(
        'UPDATE payment_methods SET balance = balance - ? WHERE id = ? AND user_id = ?',
        [amount, wallet_id, req.userId]
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM savings_goals WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
