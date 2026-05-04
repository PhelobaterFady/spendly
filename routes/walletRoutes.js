import express from 'express';
import pool from '../config/db.js';
import { verifyUser } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyUser);

router.get('/', async (req, res) => {
  try {
    const [methods] = await pool.query('SELECT * FROM payment_methods WHERE user_id = ?', [req.userId]);
    res.json(methods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, balance } = req.body;
  try {
    await pool.query(
      'INSERT INTO payment_methods (user_id, name, balance) VALUES (?, ?, ?)',
      [req.userId, name, balance || 0]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM payment_methods WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
