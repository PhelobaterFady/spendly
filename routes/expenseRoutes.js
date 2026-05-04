import express from 'express';
import pool from '../config/db.js';
import { verifyUser } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyUser);



router.get('/', async (req, res) => {
  try {
    const [expenses] = await pool.query(`
      SELECT e.*, c.name as category_name, c.icon as category_icon 
      FROM expenses e 
      LEFT JOIN categories c ON e.category_id = c.id 
      WHERE e.user_id = ? 
      ORDER BY e.date DESC
    `, [req.userId]);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/', async (req, res) => {
  const { amount, category_id, date, description, payment_method_id } = req.body;
  try {


    await pool.query(
      'INSERT INTO expenses (user_id, amount, category_id, date, description, payment_method_id) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, amount, category_id, date, description, payment_method_id]
    );
    

    if (payment_method_id) {
      await pool.query(
        'UPDATE payment_methods SET balance = balance - ? WHERE id = ? AND user_id = ?',
        [amount, payment_method_id, req.userId]
      );
    }
    
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.delete('/:id', async (req, res) => {
  try {
    const [expense] = await pool.query('SELECT amount, payment_method_id, user_id FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (expense.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    if (expense[0].payment_method_id) {
      await pool.query('UPDATE payment_methods SET balance = balance + ? WHERE id = ? AND user_id = ?', [expense[0].amount, expense[0].payment_method_id, req.userId]);
    }
    await pool.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
