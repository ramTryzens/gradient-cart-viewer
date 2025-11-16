import dotenv from 'dotenv';

// Load environment variables FIRST before importing any modules
dotenv.config();

import express from 'express';
import cors from 'cors';
import dbConnection from './config/database.js';
import { initializeDatabase } from './config/initializeDB.js';
import { initializeRules } from './config/initializeRules.js';
import ecommerceDetailsRouter from './routes/ecommerceDetails.js';
import rulesRouter from './routes/rules.js';
import merchantsRouter from './routes/merchants.js';
import userRoutes from './server/routes/userRoutes.js';
import smartOffersRouter from './routes/smartOffers.js';
import magentoRouter from './routes/magento.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// BigCommerce API configuration
const BIGCOMMERCE_API_URL = process.env.BIGCOMMERCE_API_URL;
const BIGCOMMERCE_V2_API_URL = process.env.BIGCOMMERCE_V2_API_URL;
const BIGCOMMERCE_TOKEN = process.env.BIGCOMMERCE_TOKEN;

// Magento API configuration
const MAGENTO_API_URL = process.env.MAGENTO_API_URL || 'https://qa-psp-mage.tryzens-ignite.com';
const MAGENTO_TOKEN = process.env.MAGENTO_TOKEN;

// API Routes
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    mongodb: dbConnection.getConnectionStatus() ? 'connected' : 'disconnected'
  });
});

// Ecommerce details routes
app.use('/api/ecommerce-details', ecommerceDetailsRouter);

// Rules routes
app.use('/api/rules', rulesRouter);

// Merchants routes
app.use('/api/merchants', merchantsRouter);

// Smart offers routes (n8n webhook proxy)
app.use('/api', smartOffersRouter);

// Magento routes
app.use('/api/magento', magentoRouter);

/**
 * Transform BigCommerce cart response
 * @param {Object} cart - BigCommerce cart response
 * @param {Object} customerData - Customer data from v3/customers API
 * @param {Object} ordersData - Orders data from v2/orders API
 * @returns {Object} Transformed cart data
 */
function transformBigCommerceCart(cart, customerData, ordersData) {
  // Extract number of orders
  const numberOfOrders = ordersData?.length || 0;

  // Extract first address from customer data
  const mainAddress = customerData?.data?.[0]?.addresses[0] || null;

  // Add properties inside cart.data
  if (cart.data) {
    cart.data.numberOfOrders = numberOfOrders;
    cart.data.mainAddress = mainAddress;
  }

  return cart;
}

// Proxy endpoint for cart details
app.get('/api/carts/:cartId', async (req, res) => {
  const { cartId } = req.params;

  if (!BIGCOMMERCE_TOKEN) {
    return res.status(500).json({
      error: 'BigCommerce API token not configured. Please set BIGCOMMERCE_TOKEN in your environment variables.'
    });
  }

  try {
    // First fetch the cart to get the customerId
    const cartResponse = await fetch(`${BIGCOMMERCE_API_URL}/carts/${cartId}`, {
      headers: {
        'X-Auth-Token': BIGCOMMERCE_TOKEN,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!cartResponse.ok) {
      const errorText = await cartResponse.text();
      console.error('BigCommerce API Error:', cartResponse.status, errorText);
      return res.status(cartResponse.status).json({
        error: `Failed to fetch cart: ${cartResponse.statusText}`,
        details: errorText
      });
    }

    const cart = await cartResponse.json();
    const customerId = cart.data?.customer_id || '4';

    // Make customer and orders API calls in parallel
    const [customerResponse, ordersResponse] = await Promise.all([
      fetch(`${BIGCOMMERCE_API_URL}/customers?id:in=${customerId}&include=addresses`, {
        headers: {
          'X-Auth-Token': BIGCOMMERCE_TOKEN,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${BIGCOMMERCE_V2_API_URL}/orders?customer_id=${customerId}`, {
        headers: {
          'X-Auth-Token': BIGCOMMERCE_TOKEN,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
    ]);

    // Parse all responses
    const [customerData, ordersData] = await Promise.all([
      customerResponse.json(),
      ordersResponse.json()
    ]);

    // Transform cart data
    const transformedCart = transformBigCommerceCart(cart, customerData, ordersData);

    res.json(transformedCart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Initialize server with MongoDB connection
 */
async function startServer() {
  try {
    // Connect to MongoDB Atlas
    await dbConnection.connect();

    // Initialize database with default data
    await initializeDatabase();
    await initializeRules();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📦 BigCommerce API URL: ${BIGCOMMERCE_API_URL}`);
      console.log(`📦 BigCommerce V2 API URL: ${BIGCOMMERCE_V2_API_URL}`);
      console.log(`🔑 BigCommerce Token configured: ${BIGCOMMERCE_TOKEN ? 'Yes' : 'No'}`);
      console.log(`🛍️  Magento API URL: ${MAGENTO_API_URL}`);
      console.log(`🔑 Magento Token configured: ${MAGENTO_TOKEN ? 'Yes' : 'No'}`);
      console.log(`\n🎯 Available API Endpoints:`);
      console.log(`   - GET    /api/health`);
      console.log(`   - GET    /api/carts/:cartId (BigCommerce)`);
      console.log(`   - GET    /api/magento/carts/:cartId (Magento)`);
      console.log(`   - GET    /api/ecommerce-details`);
      console.log(`   - POST   /api/ecommerce-details`);
      console.log(`   - PATCH  /api/ecommerce-details/:id`);
      console.log(`   - DELETE /api/ecommerce-details/:id`);
      console.log(`   - GET    /api/rules`);
      console.log(`   - POST   /api/rules`);
      console.log(`   - PATCH  /api/rules/:id`);
      console.log(`   - DELETE /api/rules/:id`);
      console.log(`   - GET    /api/merchants`);
      console.log(`   - GET    /api/merchants/by-user/:userId`);
      console.log(`   - POST   /api/merchants`);
      console.log(`   - PATCH  /api/merchants/:id/stores/:storeIndex`);
      console.log(`   - PATCH  /api/merchants/:id`);
      console.log(`   - DELETE /api/merchants/:id`);
      console.log(`   - POST   /api/evaluate (Smart Offers - n8n webhook proxy)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await dbConnection.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await dbConnection.disconnect();
  process.exit(0);
});

// Start the server
startServer();
