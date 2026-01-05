import { z } from 'zod';

/**
 * Environment variable schema with Zod validation
 * Validates all required environment variables at startup
 */
const envSchema = z.object({
  // Database
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .url('MONGODB_URI must be a valid URL'),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z
    .string()
    .default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z
    .string()
    .default('7d'),

  // Encryption
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)'),

  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3000'),

  // Rate Limiting
  AUTH_RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('900000'),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('5'),

  // Storage
  STORAGE_ADAPTER: z
    .enum(['local', 's3', 'gcs'])
    .default('local'),
  STORAGE_LOCAL_PATH: z
    .string()
    .default('./uploads'),
});

/**
 * Parse and validate environment variables
 * Throws descriptive error if validation fails
 */
function validateEnv() {
  try {
    const parsed = envSchema.safeParse(process.env);
    
    if (!parsed.success) {
      const errors = parsed.error.errors.map(
        (err) => `  - ${err.path.join('.')}: ${err.message}`
      );
      throw new Error(
        `Environment validation failed:\n${errors.join('\n')}`
      );
    }
    
    return parsed.data;
  } catch (error) {
    console.error('❌ Environment validation error:', error.message);
    throw error;
  }
}

/**
 * Cached environment configuration
 * Only validates once per process
 */
let cachedEnv = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Check if running in development mode
 */
export function isDevelopment() {
  return getEnv().NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction() {
  return getEnv().NODE_ENV === 'production';
}

/**
 * Check if running in test mode
 */
export function isTest() {
  return getEnv().NODE_ENV === 'test';
}

export default getEnv;
