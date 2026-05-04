import express from 'express';
import pool from '../config/db.js';
import { verifyUser } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyUser);



router.get('/summary', async (req, res) => {
  try {
    const [totalIncome] = await pool.query('SELECT SUM(amount) as total FROM income WHERE user_id = ?', [req.userId]);
    const [totalExpenses] = await pool.query('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', [req.userId]);
    const [activeInstallments] = await pool.query('SELECT SUM(monthly_amount) as total FROM installments WHERE user_id = ? AND status = "active"', [req.userId]);
    


    const [walletBalance] = await pool.query('SELECT SUM(balance) as total FROM payment_methods WHERE user_id = ?', [req.userId]);



    const [topCategory] = await pool.query(`
      SELECT c.name, SUM(e.amount) as total 
      FROM expenses e 
      JOIN categories c ON e.category_id = c.id 
      WHERE e.user_id = ? 
      GROUP BY c.id 
      ORDER BY total DESC LIMIT 1
    `, [req.userId]);

    res.json({
      totalIncome: totalIncome[0].total || 0,
      totalExpenses: totalExpenses[0].total || 0,
      activeInstallments: activeInstallments[0].total || 0,
      netBalance: walletBalance[0].total || 0,
      topCategory: topCategory.length > 0 ? topCategory[0].name : '-'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
