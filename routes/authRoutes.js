import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { verifyUser } from '../middleware/auth.js';

const router = express.Router();

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or Email already exists' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );
    
    res.status(201).json({
      id: result.insertId,
      username,
      token: createToken(result.insertId)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'email is wrong' });
    }
    
    const user = users[0];
    
    if (password !== user.password) {
      return res.status(401).json({ error: 'password is wrong' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      token: createToken(user.id)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', verifyUser, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email FROM users WHERE id = ?', [req.userId]);
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
