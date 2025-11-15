import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dbConnection from './config/database.js';
import { initializeDatabase } from './config/initializeDB.js';
import { initializeRules } from './config/initializeRules.js';
import ecommerceDetailsRouter from './routes/ecommerceDetails.js';
import rulesRouter from './routes/rules.js';
import merchantsRouter from './routes/merchants.js';
import userRoutes from './server/routes/userRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// BigCommerce API configuration
const BIGCOMMERCE_API_URL = process.env.BIGCOMMERCE_API_URL;
const BIGCOMMERCE_TOKEN = process.env.BIGCOMMERCE_TOKEN;

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

// Proxy endpoint for cart details
app.get('/api/carts/:cartId', async (req, res) => {
  const { cartId } = req.params;

  if (!BIGCOMMERCE_TOKEN) {
    return res.status(500).json({
      error: 'BigCommerce API token not configured. Please set BIGCOMMERCE_TOKEN in your environment variables.'
    });
  }

  try {
    const response = await fetch(`${BIGCOMMERCE_API_URL}/carts/${cartId}`, {
      headers: {
        'X-Auth-Token': BIGCOMMERCE_TOKEN,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BigCommerce API Error:', response.status, errorText);
      return res.status(response.status).json({
        error: `Failed to fetch cart: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    res.json(data);
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
      console.log(`🔑 Token configured: ${BIGCOMMERCE_TOKEN ? 'Yes' : 'No'}`);
      console.log(`\n🎯 Available API Endpoints:`);
      console.log(`   - GET    /api/health`);
      console.log(`   - GET    /api/carts/:cartId`);
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
