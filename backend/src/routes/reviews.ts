import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/reviews/:businessId - Get all reviews for a business
router.get('/:businessId', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;

    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name, u.city as user_city, u.state as user_state
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.business_id = $1
       ORDER BY r.created_at DESC`,
      [businessId]
    );

    // Get average rating
    const avgResult = await pool.query(
      `SELECT COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as total_reviews
       FROM reviews WHERE business_id = $1`,
      [businessId]
    );

    res.json({
      reviews: result.rows,
      averageRating: parseFloat(avgResult.rows[0].average_rating).toFixed(1),
      totalReviews: parseInt(avgResult.rows[0].total_reviews),
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews/:businessId - Add a review (seeker only)
router.post('/:businessId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Only seekers can leave reviews

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if business exists
    const businessCheck = await pool.query('SELECT id FROM businesses WHERE id = $1', [businessId]);
    if (businessCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check if seeker has a completed service request for this business
    const completedService = await pool.query(
      "SELECT id FROM service_requests WHERE business_id = $1 AND seeker_id = $2 AND status = 'completed'",
      [businessId, userId]
    );
    if (completedService.rows.length === 0) {
      return res.status(403).json({ error: 'You can only review businesses whose services you have used' });
    }

    // Check if user already reviewed this business
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND business_id = $2',
      [userId, businessId]
    );

    if (existingReview.rows.length > 0) {
      // Update existing review
      const result = await pool.query(
        `UPDATE reviews SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $3 AND business_id = $4
         RETURNING id, rating, comment, created_at, updated_at`,
        [rating, comment || null, userId, businessId]
      );
      return res.json({ message: 'Review updated', review: result.rows[0] });
    }

    // Insert new review
    const result = await pool.query(
      `INSERT INTO reviews (business_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, rating, comment, created_at`,
      [businessId, userId, rating, comment || null]
    );

    res.status(201).json({ message: 'Review added', review: result.rows[0] });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// DELETE /api/reviews/:reviewId - Delete own review
router.delete('/:reviewId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user!.userId;

    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id',
      [reviewId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or not authorized' });
    }

    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
