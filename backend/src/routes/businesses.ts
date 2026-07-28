import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

// GET /api/businesses - Get businesses with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { state, category, parentCategory, search, page = '1', limit = '20' } = req.query;

    let query = `
      SELECT b.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon,
             pc.name as parent_category_name, pc.slug as parent_category_slug
      FROM businesses b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN categories pc ON c.parent_id = pc.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (state && state !== 'ALL') {
      query += ` AND b.state = $${paramIndex}`;
      params.push(state as string);
      paramIndex++;
    }

    if (category) {
      // Filter by specific subcategory
      query += ` AND c.slug = $${paramIndex}`;
      params.push(category as string);
      paramIndex++;
    } else if (parentCategory) {
      // Filter by parent category (show all businesses in all subcategories)
      query += ` AND pc.slug = $${paramIndex}`;
      params.push(parentCategory as string);
      paramIndex++;
    }

    if (search) {
      query += ` AND (b.name ILIKE $${paramIndex} OR b.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    let countQuery = `
      SELECT COUNT(*)
      FROM businesses b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN categories pc ON c.parent_id = pc.id
      WHERE 1=1
    `;
    const countParams: (string | number)[] = [];
    let countParamIndex = 1;

    if (state && state !== 'ALL') {
      countQuery += ` AND b.state = $${countParamIndex}`;
      countParams.push(state as string);
      countParamIndex++;
    }

    if (category) {
      countQuery += ` AND c.slug = $${countParamIndex}`;
      countParams.push(category as string);
      countParamIndex++;
    } else if (parentCategory) {
      countQuery += ` AND pc.slug = $${countParamIndex}`;
      countParams.push(parentCategory as string);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (b.name ILIKE $${countParamIndex} OR b.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    query += ` ORDER BY b.is_featured DESC, b.name ASC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    res.json({
      businesses: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// GET /api/businesses/popular - Get most popular businesses (by reviews + service requests)
router.get('/popular', async (req: Request, res: Response) => {
  try {
    const { state, limit = '8' } = req.query;
    const limitNum = parseInt(limit as string);

    let query = `
      SELECT b.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon,
             pc.name as parent_category_name, pc.slug as parent_category_slug,
             COALESCE(rv.review_count, 0) as review_count,
             COALESCE(rv.avg_rating, 0) as avg_rating,
             COALESCE(sr.request_count, 0) as request_count,
             (COALESCE(rv.review_count, 0) * 2 + COALESCE(sr.request_count, 0)) as popularity_score
      FROM businesses b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN categories pc ON c.parent_id = pc.id
      LEFT JOIN (
        SELECT business_id, COUNT(*) as review_count, AVG(rating) as avg_rating
        FROM reviews GROUP BY business_id
      ) rv ON rv.business_id = b.id
      LEFT JOIN (
        SELECT business_id, COUNT(*) as request_count
        FROM service_requests GROUP BY business_id
      ) sr ON sr.business_id = b.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (state && state !== 'ALL') {
      query += ` AND b.state = $${paramIndex}`;
      params.push(state as string);
      paramIndex++;
    }

    query += ` ORDER BY popularity_score DESC, b.is_featured DESC, b.name ASC`;
    query += ` LIMIT $${paramIndex}`;
    params.push(limitNum);

    const result = await pool.query(query, params);
    res.json({ businesses: result.rows });
  } catch (error) {
    console.error('Error fetching popular businesses:', error);
    res.status(500).json({ error: 'Failed to fetch popular businesses' });
  }
});

// GET /api/businesses/nearby - Get businesses near a location within a radius
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = '10', category, parentCategory, page = '1', limit = '20' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng query parameters are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);

    // Haversine formula to calculate distance in km
    const haversine = `
      (6371 * acos(
        cos(radians($1)) * cos(radians(b.latitude)) *
        cos(radians(b.longitude) - radians($2)) +
        sin(radians($1)) * sin(radians(b.latitude))
      ))
    `;

    let query = `
      SELECT b.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon,
             pc.name as parent_category_name, pc.slug as parent_category_slug,
             ${haversine} as distance_km
      FROM businesses b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN categories pc ON c.parent_id = pc.id
      WHERE b.latitude IS NOT NULL AND b.longitude IS NOT NULL
        AND ${haversine} <= $3
    `;
    const params: (string | number)[] = [latitude, longitude, radiusKm];
    let paramIndex = 4;

    if (category) {
      query += ` AND c.slug = $${paramIndex}`;
      params.push(category as string);
      paramIndex++;
    } else if (parentCategory) {
      query += ` AND pc.slug = $${paramIndex}`;
      params.push(parentCategory as string);
      paramIndex++;
    }

    // Count query
    let countQuery = `
      SELECT COUNT(*)
      FROM businesses b
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN categories pc ON c.parent_id = pc.id
      WHERE b.latitude IS NOT NULL AND b.longitude IS NOT NULL
        AND ${haversine} <= $3
    `;
    const countParams: (string | number)[] = [latitude, longitude, radiusKm];
    let countParamIndex = 4;

    if (category) {
      countQuery += ` AND c.slug = $${countParamIndex}`;
      countParams.push(category as string);
      countParamIndex++;
    } else if (parentCategory) {
      countQuery += ` AND pc.slug = $${countParamIndex}`;
      countParams.push(parentCategory as string);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    query += ` ORDER BY ${haversine} ASC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    const result = await pool.query(query, params);

    res.json({
      businesses: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching nearby businesses:', error);
    res.status(500).json({ error: 'Failed to fetch nearby businesses' });
  }
});

// GET /api/businesses/state/:state/stats - Get business count by parent category for a state
router.get('/state/:state/stats', async (req: Request, res: Response) => {
  try {
    const { state } = req.params;

    let query: string;
    const params: string[] = [];

    if (state !== 'ALL') {
      query = `
        SELECT pc.id, pc.name, pc.slug, pc.icon, COUNT(b.id) as business_count
        FROM categories pc
        LEFT JOIN categories c ON c.parent_id = pc.id
        LEFT JOIN businesses b ON b.category_id = c.id AND b.state = $1
        WHERE pc.parent_id IS NULL
        GROUP BY pc.id, pc.name, pc.slug, pc.icon ORDER BY pc.name ASC
      `;
      params.push(state);
    } else {
      query = `
        SELECT pc.id, pc.name, pc.slug, pc.icon, COUNT(b.id) as business_count
        FROM categories pc
        LEFT JOIN categories c ON c.parent_id = pc.id
        LEFT JOIN businesses b ON b.category_id = c.id
        WHERE pc.parent_id IS NULL
        GROUP BY pc.id, pc.name, pc.slug, pc.icon ORDER BY pc.name ASC
      `;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/businesses/:id - Get a single business
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon,
              pc.name as parent_category_name, pc.slug as parent_category_slug
       FROM businesses b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN categories pc ON c.parent_id = pc.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ error: 'Failed to fetch business' });
  }
});

export default router;
