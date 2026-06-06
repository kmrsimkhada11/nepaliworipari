import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/postcode/:code - Lookup suburb by postcode
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const apiKey = process.env.AUSPOST_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch(
      `https://digitalapi.auspost.com.au/postcode/search.json?q=${code}`,
      {
        headers: {
          'AUTH-KEY': apiKey,
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to lookup postcode' });
    }

    const data = await response.json() as { localities?: { locality?: unknown } };
    const localities = data.localities?.locality;

    if (!localities) {
      return res.json({ suburbs: [] });
    }

    // Can be array or single object
    const results = Array.isArray(localities) ? localities : [localities];

    const suburbs = results.map((loc: { location: string; state: string; postcode: number }) => ({
      suburb: loc.location,
      state: loc.state,
      postcode: loc.postcode,
    }));

    res.json({ suburbs });
  } catch (error) {
    console.error('Postcode lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup postcode' });
  }
});

export default router;
