import express from 'express';
import pool from '../config/db.js';
import { verifyUser } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyUser);

router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories');
    if (categories.length === 0) {
      await pool.query(`INSERT INTO categories (name, icon, color) VALUES 
        ('Food', 'utensils', '#FF6B6B'),
        ('Transport', 'car', '#4ECDC4'),
        ('Entertainment', 'film', '#95E1D3'),
        ('Shopping', 'shopping-bag', '#F38181'),
        ('Utilities', 'zap', '#FFD93D'),
        ('Health', 'heart', '#6BCB77'),
        ('Education', 'book', '#4D96FF'),
        ('Other', 'tag', '#A8DADC')
      `);
      const [newCategories] = await pool.query('SELECT * FROM categories');
      return res.json(newCategories);
    }
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




router.post('/', async (req, res) => {
  const { name, icon, color } = req.body;
  try {
    await pool.query('INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)', [name, icon, color]);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_BY_CONSTRAINT') {
      return res.status(400).json({ error: 'Cannot delete category: in use by budgets or expenses' });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
