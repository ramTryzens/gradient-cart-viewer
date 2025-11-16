import express from 'express';

const router = express.Router();

// n8n webhook configuration - read lazily when needed, not at module load time
const getN8NConfig = () => ({
  webhookUrl: process.env.N8N_WEBHOOK_URL || 'https://tryzens-ai.app.n8n.cloud/webhook-test/getSmartOffers',
  apiKey: process.env.N8N_API_KEY || 'test@123'
});

/**
 * POST /api/evaluate
 * Proxy endpoint to get smart offers from n8n webhook
 * This endpoint is accessible from other frontend applications
 *
 * Request body:
 * {
 *   "customerId": string | number,
 *   "cartId": string,
 *   "merchantEmail": string (optional),
 *   "storeId": string (optional)
 * }
 *
 * Response:
 * Returns smart offers data from n8n webhook
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { customerId, cartId, merchantEmail, storeId } = req.body;
    console.log("🚀 ~ req.body:", req.body)

    // Validate required fields
    if (!customerId || !cartId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'customerId and cartId are required',
      });
    }

    // Prepare payload for n8n
    const payload = {
      customerId,
      cartId,
    };

    // Add optional fields if provided
    if (merchantEmail) {
      payload.merchantEmail = merchantEmail;
    }
    if (storeId) {
      payload.storeId = storeId;
    }

    // Get n8n configuration
    const { webhookUrl, apiKey } = getN8NConfig();  

    // Call n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
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
