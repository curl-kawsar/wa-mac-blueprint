import mongoose from 'mongoose';
import { getEnv } from '@/lib/config/env';

/**
 * MongoDB connection state
 */
const MONGODB_STATES = {
    disconnected: 0,
    connected: 1,
    connecting: 2,
    disconnecting: 3,
};

/**
 * Cached connection for hot-reloading in development
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB
 * Uses connection pooling and caching for performance
 * 
 * @returns {Promise<typeof mongoose>} Mongoose connection instance
 */
export async function connectDB() {
    // Return cached connection if available
    if (cached.conn) {
        return cached.conn;
    }

    // Wait for pending connection if in progress
    if (cached.promise) {
        cached.conn = await cached.promise;
        return cached.conn;
    }

    const env = getEnv();
    const uri = env.MONGODB_URI;

    const options = {
        bufferCommands: false,
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 10000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        retryReads: true,
    };

    try {
        console.log('🔌 Connecting to MongoDB...');

        cached.promise = mongoose.connect(uri, options);
        cached.conn = await cached.promise;

        console.log('✅ MongoDB connected successfully');

        // Set up connection event listeners
        mongoose.connection.on('connected', () => {
            console.log('📦 MongoDB connection established');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
            cached.conn = null;
            cached.promise = null;
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed due to app termination');
            process.exit(0);
        });

        return cached.conn;
    } catch (error) {
        cached.promise = null;
        console.error('❌ Failed to connect to MongoDB:', error);
        throw error;
    }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB() {
    if (cached.conn) {
        await mongoose.connection.close();
        cached.conn = null;
        cached.promise = null;
        console.log('🔌 MongoDB disconnected');
    }
}

/**
 * Check if MongoDB is connected
 * 
 * @returns {boolean} Connection status
 */
export function isConnected() {
    return mongoose.connection.readyState === MONGODB_STATES.connected;
}

/**
 * Get MongoDB connection state
 * 
 * @returns {string} Current connection state
 */
export function getConnectionState() {
    const state = mongoose.connection.readyState;
    return Object.keys(MONGODB_STATES).find(
        (key) => MONGODB_STATES[key] === state
    );
}

/**
 * Wrapper to ensure database connection before operations
 * 
 * @param {Function} operation - Async function to execute with DB connection
 * @returns {Promise<any>} Result of the operation
 */
export async function withDB(operation) {
    await connectDB();
    return operation();
}

export default connectDB;
