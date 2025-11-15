import express from 'express';

const router = express.Router();

// n8n webhook configuration
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://tryzens-ai.app.n8n.cloud/webhook-test/getSmartOffers';
const N8N_API_KEY = process.env.N8N_API_KEY || 'test@123';

/**
 * POST /api/evaluate
 * Proxy endpoint to get smart offers from n8n webhook
 * This endpoint is accessible from other frontend applications
 *
 * Request body:
 * {
 *   "customerId": string | number,
 *   "cartId": string
 * }
 *
 * Response:
 * Returns smart offers data from n8n webhook
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { customerId, cartId } = req.body;

    // Validate required fields
    if (!customerId || !cartId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'customerId and cartId are required',
      });
    }

    // Call n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': N8N_API_KEY,
      },
      body: JSON.stringify({
        customerId,
        cartId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', response.status, errorText);
      return res.status(response.status).json({
        success: false,
        error: `Failed to fetch smart offers: ${response.statusText}`,
        details: errorText,
      });
    }

    const data = await response.json();

    // Return the smart offers data
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
