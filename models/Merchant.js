import mongoose from 'mongoose';
import crypto from 'crypto';

// Encryption settings
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

/**
 * Encrypt sensitive data
 */
function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'),
    iv
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
function decrypt(text) {
  if (!text) return text;
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'),
      iv
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return text; // Return original if decryption fails
  }
}

/**
 * Merchant Schema
 * Stores merchant configurations that reference ecommerce platforms and business rules
 */
const merchantSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    stores: [
      {
        storeId: {
          type: String,
          required: true,
          default: () => new mongoose.Types.ObjectId().toString(),
        },
        storeName: {
          type: String,
          required: [true, 'Store name is required'],
          trim: true,
        },
        platform: {
          type: String,
          required: [true, 'Ecommerce platform is required'],
          trim: true,
        },
        platformId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'EcommerceDetail',
        },
        hostName: {
          type: String,
          required: [true, 'Host name is required'],
          trim: true,
        },
        storeDetails: {
          type: mongoose.Schema.Types.Mixed, // Dynamic object to store platform-specific credentials
          required: [true, 'Store details are required'],
        },
        apiKey: {
          type: String,
          required: [true, 'API Key is required'],
          trim: true,
        },
        apiSecret: {
          type: String,
          required: [true, 'API Secret is required'],
          trim: true,
        },
        businessRules: {
          type: Map,
          of: mongoose.Schema.Types.Mixed, // Accepts boolean or number values
          default: {},
          required: [true, 'Business rules are required'],
        },
        enabled: {
          type: Boolean,
          default: true,
        },
        _id: false, // Disable auto _id for subdocuments, we use storeId
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    collection: 'merchants', // Explicit collection name
  }
);

// Index for faster queries
merchantSchema.index({ userId: 1 });
merchantSchema.index({ email: 1 });
merchantSchema.index({ 'stores.storeId': 1 });
merchantSchema.index({ 'stores.platform': 1 });

/**
 * Validation method to check if platform exists in ecommerce_details
 * @param {String} platform - Platform name to validate
 * @returns {Promise<Boolean>}
 */
merchantSchema.statics.validatePlatform = async function (platform) {
  const EcommerceDetail = mongoose.model('EcommerceDetail');
  const existingPlatform = await EcommerceDetail.findOne({ name: platform });
  return !!existingPlatform;
};

/**
 * Validation method to check if all business rule keys exist in RuleEntriesTable
 * @param {Object} businessRules - Object with rule keys
 * @returns {Promise<Object>} { valid: boolean, invalidKeys: string[] }
 */
merchantSchema.statics.validateBusinessRules = async function (businessRules) {
  const RuleEntry = mongoose.model('RuleEntry');

  // Get all rule keys from the businessRules object
  const providedKeys = Object.keys(businessRules);

  if (providedKeys.length === 0) {
    return { valid: false, invalidKeys: [], message: 'At least one business rule is required' };
  }

  // Fetch all valid rule keys from RuleEntriesTable
  const validRules = await RuleEntry.find({}, { key: 1 });
  const validKeys = validRules.map((rule) => rule.key);

  // Check which provided keys are invalid
  const invalidKeys = providedKeys.filter((key) => !validKeys.includes(key));

  if (invalidKeys.length > 0) {
    return {
      valid: false,
      invalidKeys,
      message: `Invalid rule keys: ${invalidKeys.join(', ')}. Valid keys are: ${validKeys.join(', ')}`,
    };
  }

  return { valid: true, invalidKeys: [] };
};

/**
 * Validation method to validate business rule values
 * @param {Object} businessRules - Object with rule keys and values
 * @returns {Object} { valid: boolean, errors: string[] }
 */
merchantSchema.statics.validateBusinessRuleValues = function (businessRules) {
  const errors = [];

  for (const [key, value] of Object.entries(businessRules)) {
    // Check if value is boolean, number, or string
    if (typeof value !== 'boolean' && typeof value !== 'number' && typeof value !== 'string') {
      errors.push(`Rule "${key}" has invalid value type. Expected boolean, number, or string, got ${typeof value}`);
    }

    // If it's a number, ensure it's not negative
    if (typeof value === 'number' && value < 0) {
      errors.push(`Rule "${key}" has negative value. Numbers must be >= 0`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Pre-save middleware to encrypt API credentials
 */
merchantSchema.pre('save', function (next) {
  if (this.stores && this.stores.length > 0) {
    this.stores.forEach((store) => {
      // Encrypt apiKey if present and not already encrypted
      if (store.apiKey && !store.apiKey.includes(':')) {
        store.apiKey = encrypt(store.apiKey);
      }
      // Encrypt apiSecret if present and not already encrypted
      if (store.apiSecret && !store.apiSecret.includes(':')) {
        store.apiSecret = encrypt(store.apiSecret);
      }
    });
  }
  next();
});

/**
 * Pre-update middleware to encrypt API credentials
 */
merchantSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  // Handle $push operations for stores
  if (update.$push && update.$push.stores) {
    const storesToAdd = update.$push.stores.$each || [update.$push.stores];
    storesToAdd.forEach((store) => {
      if (store.apiKey && !store.apiKey.includes(':')) {
        store.apiKey = encrypt(store.apiKey);
      }
      if (store.apiSecret && !store.apiSecret.includes(':')) {
        store.apiSecret = encrypt(store.apiSecret);
      }
    });
  }

  // Handle direct stores update
  if (update.stores) {
    update.stores.forEach((store) => {
      if (store.apiKey && !store.apiKey.includes(':')) {
        store.apiKey = encrypt(store.apiKey);
      }
      if (store.apiSecret && !store.apiSecret.includes(':')) {
        store.apiSecret = encrypt(store.apiSecret);
      }
    });
  }

  next();
});

/**
 * Post-find middleware to decrypt API credentials
 */
function decryptStores(doc) {
  if (doc && doc.stores && doc.stores.length > 0) {
    doc.stores.forEach((store) => {
      if (store.apiKey) {
        store.apiKey = decrypt(store.apiKey);
      }
      if (store.apiSecret) {
        store.apiSecret = decrypt(store.apiSecret);
      }
    });
  }
  return doc;
}

merchantSchema.post('find', function (docs) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => decryptStores(doc));
  }
});

merchantSchema.post('findOne', function (doc) {
  decryptStores(doc);
});

merchantSchema.post('findOneAndUpdate', function (doc) {
  decryptStores(doc);
});

merchantSchema.post('save', function (doc) {
  decryptStores(doc);
});

// Create and export the model
const Merchant = mongoose.model('Merchant', merchantSchema);

export default Merchant;
