import { Router, Response } from 'express';
import pool from '../config/database';
import { authenticate, requireProvider, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/register - Register a business directly (provider only)
router.post('/', authenticate, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, email, categoryId, state, city, description, website, latitude, longitude, address, facebook, instagram, tiktok } = req.body;
    const userId = req.user!.userId;

    // Validate required fields
    if (!name || !phone || !email || !categoryId || !state || !city) {
      return res.status(400).json({ error: 'Name, phone, email, category, state, and city are required' });
    }

    // Validate phone format (Australian mobile)
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^(\+?61|0)4\d{8}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid Australian mobile number (04XX XXX XXX)' });
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const result = await pool.query(
      `INSERT INTO businesses (name, category_id, user_id, state, city, address, phone, email, description, website, latitude, longitude, facebook, instagram, tiktok)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id`,
      [name, categoryId, userId, state, city, address || null, cleanPhone, email, description || null, website || null, latitude || null, longitude || null, facebook || null, instagram || null, tiktok || null]
    );

    res.status(201).json({
      success: true,
      message: 'Business registered successfully!',
      businessId: result.rows[0].id,
    });
  } catch (error) {
    console.error('Error registering business:', error);
    res.status(500).json({ error: 'Failed to register business. Please try again.' });
  }
});

// GET /api/register/my-businesses - Get businesses owned by the logged-in provider
router.get('/my-businesses', authenticate, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT b.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon
       FROM businesses b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    res.json({ businesses: result.rows });
  } catch (error) {
    console.error('Error fetching my businesses:', error);
    res.status(500).json({ error: 'Failed to fetch your businesses' });
  }
});

// PUT /api/register/:id - Update a business (provider only, own business)
router.put('/:id', authenticate, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { name, phone, email, categoryId, state, city, address, description, website, facebook, instagram, tiktok } = req.body;

    // Verify ownership
    const check = await pool.query('SELECT id FROM businesses WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found or not authorized' });
    }

    const result = await pool.query(
      `UPDATE businesses SET 
        name = $1, phone = $2, email = $3, category_id = $4, state = $5, city = $6, 
        address = $7, description = $8, website = $9, facebook = $10, instagram = $11, 
        tiktok = $12, updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 AND user_id = $14
       RETURNING id`,
      [name, phone, email, categoryId || null, state, city, address || null, description || null, website || null, facebook || null, instagram || null, tiktok || null, id, userId]
    );

    res.json({ message: 'Business updated', businessId: result.rows[0].id });
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

// DELETE /api/register/:id - Delete a business (provider only, own business)
router.delete('/:id', authenticate, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await pool.query('DELETE FROM businesses WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found or not authorized' });
    }

    res.json({ message: 'Business deleted' });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ error: 'Failed to delete business' });
  }
});

export default router;
