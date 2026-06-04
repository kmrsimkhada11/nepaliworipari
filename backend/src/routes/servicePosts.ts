import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/service-posts - Seeker creates a service wanted post
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, categoryId, state, city, budget } = req.body;
    const seekerId = req.user!.userId;
    const role = req.user!.role;


    if (!title || !state) {
      return res.status(400).json({ error: 'Title and state are required' });
    }

    const result = await pool.query(
      `INSERT INTO service_posts (seeker_id, category_id, title, description, state, city, budget)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [seekerId, categoryId || null, title, description || null, state, city || null, budget || null]
    );

    res.status(201).json({ message: 'Service post created', post: result.rows[0] });
  } catch (error) {
    console.error('Error creating service post:', error);
    res.status(500).json({ error: 'Failed to create service post' });
  }
});

// GET /api/service-posts - Get open service posts (for providers to browse)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { state, category, page = '1', limit = '20' } = req.query;

    let query = `
      SELECT sp.*, u.name as seeker_name, u.city as seeker_city, u.state as seeker_state,
             c.name as category_name, c.icon as category_icon,
             pc.name as parent_category_name
      FROM service_posts sp
      JOIN users u ON sp.seeker_id = u.id
      LEFT JOIN categories c ON sp.category_id = c.id
      LEFT JOIN categories pc ON c.parent_id = pc.id
      WHERE sp.status = 'open'
    `;
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (state && state !== 'ALL') {
      query += ` AND sp.state = $${paramIndex}`;
      params.push(state as string);
      paramIndex++;
    }

    if (category) {
      query += ` AND (c.slug = $${paramIndex} OR pc.slug = $${paramIndex})`;
      params.push(category as string);
      paramIndex++;
    }

    // Count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    query += ` ORDER BY sp.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    res.json({
      posts: result.rows,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching service posts:', error);
    res.status(500).json({ error: 'Failed to fetch service posts' });
  }
});

// GET /api/service-posts/my-posts - Seeker's own posts
router.get('/my-posts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const seekerId = req.user!.userId;
    const result = await pool.query(
      `SELECT sp.*, c.name as category_name, c.icon as category_icon
       FROM service_posts sp
       LEFT JOIN categories c ON sp.category_id = c.id
       WHERE sp.seeker_id = $1
       ORDER BY sp.created_at DESC`,
      [seekerId]
    );
    res.json({ posts: result.rows });
  } catch (error) {
    console.error('Error fetching my posts:', error);
    res.status(500).json({ error: 'Failed to fetch your posts' });
  }
});

// GET /api/service-posts/:id - Get a single service post by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT sp.*, u.name as seeker_name, u.city as seeker_city, u.state as seeker_state,
              c.name as category_name, c.icon as category_icon,
              pc.name as parent_category_name
       FROM service_posts sp
       JOIN users u ON sp.seeker_id = u.id
       LEFT JOIN categories c ON sp.category_id = c.id
       LEFT JOIN categories pc ON c.parent_id = pc.id
       WHERE sp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post: result.rows[0] });
  } catch (error) {
    console.error('Error fetching service post:', error);
    res.status(500).json({ error: 'Failed to fetch service post' });
  }
});

// PATCH /api/service-posts/:id/close - Seeker closes their post
router.patch('/:id/close', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const seekerId = req.user!.userId;

    const result = await pool.query(
      "UPDATE service_posts SET status = 'closed' WHERE id = $1 AND seeker_id = $2 RETURNING *",
      [id, seekerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or not authorized' });
    }

    res.json({ message: 'Post closed', post: result.rows[0] });
  } catch (error) {
    console.error('Error closing post:', error);
    res.status(500).json({ error: 'Failed to close post' });
  }
});

// DELETE /api/service-posts/:id - Delete a post
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const seekerId = req.user!.userId;

    const result = await pool.query(
      'DELETE FROM service_posts WHERE id = $1 AND seeker_id = $2 RETURNING id',
      [id, seekerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or not authorized' });
    }

    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
