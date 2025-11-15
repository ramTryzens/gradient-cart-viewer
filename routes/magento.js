import express from 'express';

const router = express.Router();

// Magento API configuration
const MAGENTO_API_URL = process.env.MAGENTO_API_URL || 'https://qa-psp-mage.tryzens-ignite.com';
const MAGENTO_TOKEN = process.env.MAGENTO_TOKEN || 'eyJraWQiOiIxIiwiYWxnIjoiSFMyNTYifQ.eyJ1aWQiOjksInV0eXBpZCI6MiwiaWF0IjoxNzYzMTg1MTQ2LCJleHAiOjE3NjMxODg3NDZ9.mOp4vCjwQU4HhxonCEG8QkLnkLTneDRPbWQ-daakx1I';

/**
 * Transform Magento cart response to BigCommerce format
 * @param {Object} magentoCart - Magento cart response
 * @returns {Object} Transformed cart in BigCommerce format
 */
function transformMagentoCart(magentoCart, magentoCartTotal) {
  console.log("🚀 ~ transformMagentoCart ~ magentoCart:", magentoCart)
  // Extract currency code
  const currencyCode = magentoCart.currency?.quote_currency_code ||
                      magentoCart.store_currency_code ||
                      'USD';

  // Transform cart items
  const physicalItems = (magentoCart.items || []).map(item => ({
    id: String(item.item_id),
    product_id: item.product_id,
    variant_id: item.product_id, // Magento doesn't always have separate variant_id
    name: item.name,
    quantity: item.qty,
    list_price: item.base_price || item.price || 0,
    sale_price: item.base_price || item.price || 0,
    image_url: item.product?.thumbnail ||
               item.extension_attributes?.image ||
               ''
  }));

  // Build transformed response
  return {
    data: {
      id: String(magentoCart.id || magentoCart.entity_id),
      customer_id: magentoCart.customer_id || magentoCart.customer?.id || 0,
      email: magentoCart.customer_email || magentoCart.customer?.email || '',
      currency: {
        code: currencyCode
      },
      cart_amount: magentoCart.grand_total || magentoCart.base_grand_total || 0,
      line_items: {
        physical_items: physicalItems
      },
      cart_amount: magentoCartTotal?.grand_total
    }
  };
}

/**
 * GET /api/magento/carts/:cartId
 * Fetch cart details from Magento API and transform to BigCommerce format
 */
router.get('/carts/:cartId', async (req, res) => {
  const { cartId } = req.params;
  console.log("🚀 ~ cartId:", cartId)

  if (!MAGENTO_TOKEN) {
    return res.status(500).json({
      error: 'Magento API token not configured. Please set MAGENTO_TOKEN in your environment variables.'
    });
  }

  try {
    const response = await fetch(`${MAGENTO_API_URL}/rest/V1/carts/${cartId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAGENTO_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    // Calling only for grand total
    const responseGrandTotal = await fetch(`${MAGENTO_API_URL}/rest/V1/carts/${cartId}/totals`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAGENTO_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok || !responseGrandTotal.ok) {
      const errorText = await response.text();
      console.error('Magento API Error:', response.status, errorText);

      // Return appropriate error based on status code
      if (response.status === 404) {
        return res.status(404).json({
          error: `Cart not found: ${cartId}`
        });
      }

      if (response.status === 401) {
        return res.status(401).json({
          error: 'Unauthorized: Invalid Magento API token'
        });
      }

      return res.status(response.status).json({
        error: `Failed to fetch cart from Magento: ${response.statusText}`,
        details: errorText
      });
    }

    const magentoCart = await response.json();
    const magentoCartTotal = await responseGrandTotal.json();

    // Transform Magento response to BigCommerce format
    const transformedCart = transformMagentoCart(magentoCart, magentoCartTotal);

    res.json(transformedCart);
  } catch (error) {
    console.error('Error fetching Magento cart:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
