import express from 'express';
import mongoose from 'mongoose';
import Merchant from '../models/Merchant.js';

const router = express.Router();

/**
 * GET /api/merchants
 * Retrieve all merchants
 */
router.get('/', async (req, res) => {
  try {
    const merchants = await Merchant.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: merchants.length,
      data: merchants,
    });
  } catch (error) {
    console.error('Error fetching merchants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch merchants',
      message: error.message,
    });
  }
});

/**
 * GET /api/merchants/by-user/:userId
 * Retrieve merchant by userId (Clerk user ID)
 */
router.get('/by-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId',
        message: 'userId parameter is required',
      });
    }

    const merchant = await Merchant.findOne({ userId }).sort({ createdAt: -1 });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found',
        message: `No merchant found for user ID: ${userId}`,
      });
    }

    res.status(200).json({
      success: true,
      data: merchant,
    });
  } catch (error) {
    console.error('Error fetching merchant by userId:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch merchant',
      message: error.message,
    });
  }
});

/**
 * POST /api/merchants
 * Create a new merchant with validation
 */
router.post('/', async (req, res) => {
  try {
    console.log('=== POST /api/merchants ===');
    console.log('Received POST request body:', JSON.stringify(req.body, null, 2));
    console.log('Request body keys:', Object.keys(req.body));

    const { userId, businessName, email, name, stores } = req.body;

    console.log('Extracted values:');
    console.log('  userId:', userId);
    console.log('  businessName:', businessName);
    console.log('  email:', email);
    console.log('  name:', name);
    console.log('  stores:', stores ? `Array(${stores.length})` : 'undefined');

    // Validate required fields
    if (!userId) {
      console.log('Validation failed: userId is missing');
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'User ID is required',
      });
    }

    // Use businessName if provided, otherwise fall back to name, then email
    const finalBusinessName = businessName || name || email;
    if (!finalBusinessName) {
      console.log('Validation failed: businessName/name/email is missing');
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'Business name or email is required',
      });
    }

    if (!email) {
      console.log('Validation failed: email is missing');
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'Email is required',
      });
    }

    if (!stores || !Array.isArray(stores) || stores.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'At least one store is required',
      });
    }

    // Validate each store
    for (const store of stores) {
      if (!store.storeName) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field',
          message: 'Store name is required for all stores',
        });
      }

      if (!store.platform || !store.storeDetails) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'platform and storeDetails are required for all stores',
        });
      }

      // Validate storeDetails is an object with at least one property
      if (typeof store.storeDetails !== 'object' || Object.keys(store.storeDetails).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid storeDetails',
          message: 'storeDetails must be an object with at least one credential',
        });
      }

      if (!store.businessRules || typeof store.businessRules !== 'object') {
        console.log('Validation failed: businessRules missing or not an object for store:', store.storeName);
        return res.status(400).json({
          success: false,
          error: 'Missing required field',
          message: 'businessRules object is required for all stores',
        });
      }

      console.log(`Validating store "${store.storeName}":`, {
        platform: store.platform,
        storeDetailsKeys: Object.keys(store.storeDetails),
        businessRulesKeys: Object.keys(store.businessRules)
      });

      // Validate that the platform exists in ecommerce_details
      const platformExists = await Merchant.validatePlatform(store.platform);
      if (!platformExists) {
        return res.status(400).json({
          success: false,
          error: 'Invalid platform',
          message: `Platform "${store.platform}" does not exist in ecommerce_details collection`,
        });
      }

      // Validate business rule keys
      const ruleValidation = await Merchant.validateBusinessRules(store.businessRules);
      if (!ruleValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid business rules',
          message: ruleValidation.message,
          invalidKeys: ruleValidation.invalidKeys,
        });
      }

      // Validate business rule values
      const valueValidation = Merchant.validateBusinessRuleValues(store.businessRules);
      if (!valueValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid business rule values',
          message: valueValidation.errors.join('; '),
        });
      }
    }

    // Create new merchant
    console.log('All validations passed. Creating merchant with stores:', stores.length);

    const merchantDoc = {
      userId,
      businessName: finalBusinessName,
      email,
      stores,
    };

    console.log('Creating Merchant document with data:', JSON.stringify(merchantDoc, null, 2));

    const newMerchant = new Merchant(merchantDoc);

    console.log('Merchant document created, saving to DB...');
    console.log('Document before save:', JSON.stringify(newMerchant.toObject(), null, 2));

    await newMerchant.save();
    console.log('Document saved successfully!');

    console.log('Merchant saved successfully:', newMerchant._id);

    res.status(201).json({
      success: true,
      message: 'Merchant created successfully',
      data: newMerchant,
    });
  } catch (error) {
    console.error('Error creating merchant:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.message,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      console.error('Duplicate key error:', error);
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry',
        message: 'A merchant already exists for this user. Use PATCH to add stores instead of POST.',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create merchant',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/merchants/:id/stores/:storeIndex
 * Update a specific store within a merchant
 * NOTE: This route MUST come before the general PATCH /:id route
 */
router.patch('/:id/stores/:storeIndex', async (req, res) => {
  try {
    console.log('=== PATCH /api/merchants/:id/stores/:storeIndex ===');
    console.log('Request params:', req.params);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { id, storeIndex } = req.params;
    const index = parseInt(storeIndex);

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format',
        message: 'The provided ID is not a valid MongoDB ObjectId',
      });
    }

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid store index',
        message: 'Store index must be a non-negative number',
      });
    }

    // Fetch existing merchant
    const existingMerchant = await Merchant.findById(id);
    if (!existingMerchant) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Merchant with ID ${id} not found`,
      });
    }

    if (!existingMerchant.stores || index >= existingMerchant.stores.length) {
      return res.status(404).json({
        success: false,
        error: 'Store not found',
        message: `Store at index ${index} not found`,
      });
    }

    const { storeName, platform, platformId, hostName, storeDetails, apiKey, apiSecret, businessRules } = req.body;

    // Validate required fields
    if (!storeName || !platform || !storeDetails) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'storeName, platform and storeDetails are required',
      });
    }

    // Validate platform exists
    const platformExists = await Merchant.validatePlatform(platform);
    if (!platformExists) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform',
        message: `Platform "${platform}" does not exist in ecommerce_details collection`,
      });
    }

    // Validate business rules
    if (!businessRules || typeof businessRules !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'businessRules object is required',
      });
    }

    const ruleValidation = await Merchant.validateBusinessRules(businessRules);
    if (!ruleValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business rules',
        message: ruleValidation.message,
        invalidKeys: ruleValidation.invalidKeys,
      });
    }

    const valueValidation = Merchant.validateBusinessRuleValues(businessRules);
    if (!valueValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business rule values',
        message: valueValidation.errors.join('; '),
      });
    }

    // Update the store at the specified index
    const updateField = `stores.${index}`;
    const updateData = {
      [updateField]: {
        storeId: existingMerchant.stores[index].storeId, // Keep existing storeId
        storeName,
        platform,
        platformId,
        hostName,
        storeDetails,
        apiKey,
        apiSecret,
        businessRules,
        enabled: existingMerchant.stores[index].enabled, // Keep existing enabled status
      }
    };

    const updatedMerchant = await Merchant.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: false,
      }
    );

    if (!updatedMerchant) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Merchant with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Store updated successfully',
      data: updatedMerchant,
    });
  } catch (error) {
    console.error('Error updating store:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update store',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/merchants/:id
 * Update a specific merchant by MongoDB _id
 * Allows updating stores, businessName, and email
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format',
        message: 'The provided ID is not a valid MongoDB ObjectId',
      });
    }

    const { userId, businessName, email, name, stores } = req.body;

    // Fetch existing merchant
    const existingMerchant = await Merchant.findById(id);
    if (!existingMerchant) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Merchant with ID ${id} not found`,
      });
    }

    // Build update object - only update fields that are provided
    const updateData = {};

    // Update businessName if provided (with fallback to name or email)
    if (businessName || name) {
      updateData.businessName = businessName || name || existingMerchant.businessName;
    }

    // Update email if provided
    if (email) {
      updateData.email = email;
    }

    // Handle stores update - add new store to existing stores array
    if (stores && Array.isArray(stores) && stores.length > 0) {
      console.log('Adding new stores to existing merchant:', stores.length);

      // Validate each new store
      for (const store of stores) {
        if (!store.storeName || !store.platform || !store.storeDetails) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            message: 'storeName, platform and storeDetails are required for all stores',
          });
        }

        // Validate platform exists
        const platformExists = await Merchant.validatePlatform(store.platform);
        if (!platformExists) {
          return res.status(400).json({
            success: false,
            error: 'Invalid platform',
            message: `Platform "${store.platform}" does not exist in ecommerce_details collection`,
          });
        }

        // Validate business rules
        if (!store.businessRules || typeof store.businessRules !== 'object') {
          return res.status(400).json({
            success: false,
            error: 'Missing required field',
            message: 'businessRules object is required for all stores',
          });
        }

        const ruleValidation = await Merchant.validateBusinessRules(store.businessRules);
        if (!ruleValidation.valid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid business rules',
            message: ruleValidation.message,
            invalidKeys: ruleValidation.invalidKeys,
          });
        }

        const valueValidation = Merchant.validateBusinessRuleValues(store.businessRules);
        if (!valueValidation.valid) {
          return res.status(400).json({
            success: false,
            error: 'Invalid business rule values',
            message: valueValidation.errors.join('; '),
          });
        }
      }

      // Add new stores to existing stores array using $push
      updateData.$push = { stores: { $each: stores } };
    }

    console.log('Update data:', JSON.stringify(updateData, null, 2));

    // Update the document
    // Separate $push operations from $set operations
    const updateOperations = {};
    if (updateData.$push) {
      updateOperations.$push = updateData.$push;
      delete updateData.$push;
    }
    if (Object.keys(updateData).length > 0) {
      updateOperations.$set = updateData;
    }

    const updatedMerchant = await Merchant.findByIdAndUpdate(
      id,
      updateOperations,
      {
        new: true, // Return the updated document
        runValidators: false, // Don't run validators on partial updates
      }
    );

    if (!updatedMerchant) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Merchant with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Merchant updated successfully',
      data: updatedMerchant,
    });
  } catch (error) {
    console.error('Error updating merchant:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update merchant',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/merchants/:id
 * Delete a specific merchant by MongoDB _id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format',
        message: 'The provided ID is not a valid MongoDB ObjectId',
      });
    }

    // Delete the document
    const deletedMerchant = await Merchant.findByIdAndDelete(id);

    if (!deletedMerchant) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Merchant with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Merchant deleted successfully',
      data: deletedMerchant,
    });
  } catch (error) {
    console.error('Error deleting merchant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete merchant',
      message: error.message,
    });
  }
});

export default router;
