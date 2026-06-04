import { Router, Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/service-requests/:businessId - Seeker requests a service
router.post('/:businessId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.params;
    const { note } = req.body;
    const seekerId = req.user!.userId;
    const role = req.user!.role;


    // Check if business exists
    const business = await pool.query('SELECT id, user_id FROM businesses WHERE id = $1', [businessId]);
    if (business.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check if there's already a pending/active request
    const existing = await pool.query(
      "SELECT id FROM service_requests WHERE business_id = $1 AND seeker_id = $2 AND status IN ('pending', 'accepted')",
      [businessId, seekerId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You already have an active request for this service' });
    }

    const result = await pool.query(
      `INSERT INTO service_requests (business_id, seeker_id, note) VALUES ($1, $2, $3) RETURNING *`,
      [businessId, seekerId, note || null]
    );

    // Notify the provider via socket
    const providerId = business.rows[0].user_id;
    if (providerId) {
      try {
        const { io } = await import('../index');
        io.to(`user_${providerId}`).emit('new_service_request', {
          requestId: result.rows[0].id,
          businessId,
        });
      } catch {
        // Socket notification is best-effort
      }
    }

    res.status(201).json({ message: 'Service requested', request: result.rows[0] });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ error: 'Failed to create service request' });
  }
});

// GET /api/service-requests/pending-count - Get pending request count for provider
router.get('/pending-count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (role === 'provider') {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM service_requests sr
         JOIN businesses b ON sr.business_id = b.id
         WHERE b.user_id = $1 AND sr.status = 'pending'`,
        [userId]
      );
      res.json({ pendingCount: parseInt(result.rows[0].count) });
    } else {
      res.json({ pendingCount: 0 });
    }
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({ error: 'Failed to fetch pending count' });
  }
});

// GET /api/service-requests/my-requests - Seeker's requests
router.get('/my-requests', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const seekerId = req.user!.userId;

    const result = await pool.query(
      `SELECT sr.*, b.name as business_name, b.city, b.state as business_state
       FROM service_requests sr
       JOIN businesses b ON sr.business_id = b.id
       WHERE sr.seeker_id = $1
       ORDER BY sr.created_at DESC`,
      [seekerId]
    );

    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/service-requests/provider-requests - Provider sees incoming requests
router.get('/provider-requests', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const providerId = req.user!.userId;

    if (req.user!.role !== 'provider') {
      return res.status(403).json({ error: 'Only providers can view incoming requests' });
    }

    const result = await pool.query(
      `SELECT sr.*, b.name as business_name, u.name as seeker_name, u.phone as seeker_phone, u.email as seeker_email
       FROM service_requests sr
       JOIN businesses b ON sr.business_id = b.id
       JOIN users u ON sr.seeker_id = u.id
       WHERE b.user_id = $1
       ORDER BY sr.created_at DESC`,
      [providerId]
    );

    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Error fetching provider requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// PATCH /api/service-requests/:requestId/status - Provider updates request status
router.patch('/:requestId/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const providerId = req.user!.userId;

    if (req.user!.role !== 'provider') {
      return res.status(403).json({ error: 'Only providers can update request status' });
    }

    const validStatuses = ['accepted', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted, completed, or rejected' });
    }

    // Verify the provider owns the business
    const check = await pool.query(
      `SELECT sr.id FROM service_requests sr
       JOIN businesses b ON sr.business_id = b.id
       WHERE sr.id = $1 AND b.user_id = $2`,
      [requestId, providerId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or not authorized' });
    }

    const completedAt = status === 'completed' ? 'CURRENT_TIMESTAMP' : 'NULL';
    const result = await pool.query(
      `UPDATE service_requests SET status = $1, completed_at = ${completedAt} WHERE id = $2 RETURNING *`,
      [status, requestId]
    );

    res.json({ message: `Request ${status}`, request: result.rows[0] });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// GET /api/service-requests/can-review/:businessId - Check if seeker can review
router.get('/can-review/:businessId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.params;
    const seekerId = req.user!.userId;

    const result = await pool.query(
      "SELECT id FROM service_requests WHERE business_id = $1 AND seeker_id = $2 AND status = 'completed'",
      [businessId, seekerId]
    );

    res.json({ canReview: result.rows.length > 0 });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({ error: 'Failed to check review eligibility' });
  }
});

export default router;
