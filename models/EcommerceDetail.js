import mongoose from 'mongoose';

/**
 * Ecommerce Detail Schema
 * Stores e-commerce platform configurations including API endpoints and required credentials
 */
const ecommerceDetailSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Platform name is required'],
      trim: true,
    },
    api_urls: {
      type: Map,
      of: {
        endpoint: {
          type: String,
          required: true,
        },
        method: {
          type: String,
          required: true,
          enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          uppercase: true,
        },
      },
      default: {},
    },
    required_credentials: [
      {
        key: {
          type: String,
          required: true,
          trim: true,
        },
        label: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        type: {
          type: String,
          enum: ['text', 'password', 'url'],
          default: 'text',
        },
        required: {
          type: Boolean,
          default: true,
        },
        _id: false, // Disable auto-generation of _id for subdocuments
      },
    ],
    enabled: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    collection: 'ecommerce_details', // Explicit collection name
  }
);

// Index for faster queries
ecommerceDetailSchema.index({ name: 1 });

// Create and export the model
const EcommerceDetail = mongoose.model('EcommerceDetail', ecommerceDetailSchema);

export default EcommerceDetail;
