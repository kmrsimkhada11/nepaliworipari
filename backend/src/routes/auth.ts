import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

const VALID_ROLES = ['seeker', 'provider'];

// Signup
router.post('/signup', async (req: Request, res: Response) => {
  const { name, email, password, role, phone, state, city } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const userRole = role && VALID_ROLES.includes(role) ? role : 'seeker';

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, state, city) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, phone, state, city, created_at`,
      [name, email.toLowerCase(), passwordHash, userRole, phone || null, state || null, city || null]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, state: user.state, city: user.city },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user
    const result = await pool.query('SELECT id, name, email, password_hash, role, phone, state, city FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, state: user.state, city: user.city },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user (protected route)
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
    const result = await pool.query('SELECT id, name, email, role, phone, state, city, created_at FROM users WHERE id = $1', [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// GET /api/auth/stats - Get user overview stats
router.get('/stats', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const userId = decoded.userId;

    const [listings, requests, messages, reviews] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM businesses WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM service_posts WHERE seeker_id = $1', [userId]),
      pool.query('SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND is_read = FALSE', [userId]),
      pool.query("SELECT COUNT(*) as count FROM service_requests WHERE business_id IN (SELECT id FROM businesses WHERE user_id = $1) AND status = 'pending'", [userId]),
    ]);

    res.json({
      activeListings: parseInt(listings.rows[0].count),
      activeRequests: parseInt(requests.rows[0].count),
      unreadMessages: parseInt(messages.rows[0].count),
      pendingRequests: parseInt(reviews.rows[0].count),
    });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
