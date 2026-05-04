import express from 'express';
import pool from '../config/db.js';
import { verifyUser } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyUser);

router.get('/', async (req, res) => {
  try {
    const [budgets] = await pool.query(`
      SELECT 
        b.*, 
        c.name as category_name, 
        c.icon as category_icon,
        (SELECT SUM(amount) FROM expenses 
         WHERE category_id = b.category_id 
         AND user_id = b.user_id 
         AND MONTH(date) = b.month 
         AND YEAR(date) = b.year) as spent
      FROM budgets b 
      JOIN categories c ON b.category_id = c.id 
      WHERE b.user_id = ?
    `, [req.userId]);
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { category_id, limit_amount, month, year } = req.body;
  try {
    await pool.query(
      'INSERT INTO budgets (user_id, category_id, limit_amount, month, year) VALUES (?, ?, ?, ?, ?)',
      [req.userId, category_id, limit_amount, month, year]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
