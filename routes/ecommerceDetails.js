import express from 'express';
import mongoose from 'mongoose';
import EcommerceDetail from '../models/EcommerceDetail.js';

const router = express.Router();

/**
 * GET /api/ecommerce-details
 * Retrieve all ecommerce detail entries
 * Query params: ?enabled=true|false (optional filter)
 */
router.get('/', async (req, res) => {
  try {
    const { enabled } = req.query;
    const filter = {};

    // Filter by enabled status if provided
    if (enabled !== undefined) {
      filter.enabled = enabled === 'true';
    }

    const details = await EcommerceDetail.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: details.length,
      data: details,
    });
  } catch (error) {
    console.error('Error fetching ecommerce details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ecommerce details',
      message: error.message,
    });
  }
});

/**
 * POST /api/ecommerce-details
 * Create a new ecommerce detail entry
 */
router.post('/', async (req, res) => {
  try {
    const { name, api_urls, required_credentials, enabled } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Platform "name" is required',
      });
    }

    // Validate api_urls structure if provided
    if (api_urls) {
      for (const [key, value] of Object.entries(api_urls)) {
        if (!value.endpoint || !value.method) {
          return res.status(400).json({
            success: false,
            error: 'Invalid api_urls format',
            message: `Each API URL entry must have 'endpoint' and 'method' properties. Issue with key: ${key}`,
          });
        }

        // Validate HTTP method
        const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
        if (!validMethods.includes(value.method.toUpperCase())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid HTTP method',
            message: `Method must be one of: ${validMethods.join(', ')}`,
          });
        }
      }
    }

    // Validate required_credentials structure if provided
    if (required_credentials) {
      if (!Array.isArray(required_credentials)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid required_credentials format',
          message: 'required_credentials must be an array',
        });
      }

      for (const credential of required_credentials) {
        if (!credential.key || !credential.label) {
          return res.status(400).json({
            success: false,
            error: 'Invalid credential format',
            message: 'Each credential must have "key" and "label" properties',
          });
        }
      }
    }

    // Create new ecommerce detail
    const newDetail = new EcommerceDetail({
      name,
      api_urls: api_urls || {},
      required_credentials: required_credentials || [],
      enabled: enabled !== undefined ? enabled : true,
    });

    await newDetail.save();

    res.status(201).json({
      success: true,
      message: 'Ecommerce detail created successfully',
      data: newDetail,
    });
  } catch (error) {
    console.error('Error creating ecommerce detail:', error);

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
      return res.status(409).json({
        success: false,
        error: 'Duplicate entry',
        message: 'An ecommerce detail with this name already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create ecommerce detail',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/ecommerce-details/:id
 * Update a specific ecommerce detail entry by MongoDB _id
 * Allows updating: name, api_version, and api_urls
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

    // Define allowed fields for update
    const allowedFields = ['name', 'api_urls', 'required_credentials', 'enabled'];
    const updateData = {};

    // Extract only allowed fields from request body
    for (const field of allowedFields) {
      if (req.body.hasOwnProperty(field)) {
        updateData[field] = req.body[field];
      }
    }

    // Check if there's any valid data to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
        message: `Allowed fields are: ${allowedFields.join(', ')}`,
      });
    }

    // Validate api_urls structure if provided
    if (updateData.api_urls) {
      const apiUrls = updateData.api_urls;

      // Validate each endpoint in api_urls
      for (const [key, value] of Object.entries(apiUrls)) {
        if (!value.endpoint || !value.method) {
          return res.status(400).json({
            success: false,
            error: 'Invalid api_urls format',
            message: `Each API URL entry must have 'endpoint' and 'method' properties. Issue with key: ${key}`,
          });
        }

        // Validate HTTP method
        const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
        if (!validMethods.includes(value.method.toUpperCase())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid HTTP method',
            message: `Method must be one of: ${validMethods.join(', ')}`,
          });
        }
      }
    }

    // Validate required_credentials structure if provided
    if (updateData.hasOwnProperty('required_credentials')) {
      if (updateData.required_credentials === null || updateData.required_credentials === undefined) {
        // Allow clearing credentials by setting to empty array
        updateData.required_credentials = [];
      } else if (!Array.isArray(updateData.required_credentials)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid required_credentials format',
          message: 'required_credentials must be an array',
        });
      } else {
        // Validate each credential
        for (const credential of updateData.required_credentials) {
          if (!credential.key || !credential.label) {
            return res.status(400).json({
              success: false,
              error: 'Invalid credential format',
              message: 'Each credential must have "key" and "label" properties',
            });
          }
        }
      }
    }

    console.log('Updating ecommerce detail with data:', JSON.stringify(updateData, null, 2));

    // Update the document
    const updatedDetail = await EcommerceDetail.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true, // Return the updated document
        runValidators: true, // Run schema validators
      }
    );

    console.log('Updated detail:', JSON.stringify(updatedDetail, null, 2));

    if (!updatedDetail) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Ecommerce detail with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ecommerce detail updated successfully',
      data: updatedDetail,
    });
  } catch (error) {
    console.error('Error updating ecommerce detail:', error);

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
      error: 'Failed to update ecommerce detail',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/ecommerce-details/:id
 * Delete a specific ecommerce detail entry by MongoDB _id
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
    const deletedDetail = await EcommerceDetail.findByIdAndDelete(id);

    if (!deletedDetail) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Ecommerce detail with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ecommerce detail deleted successfully',
      data: deletedDetail,
    });
  } catch (error) {
    console.error('Error deleting ecommerce detail:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ecommerce detail',
      message: error.message,
    });
  }
});

export default router;
