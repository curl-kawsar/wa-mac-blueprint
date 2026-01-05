import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { connectDB } from '@/lib/db/mongoose';
import { getUserModel } from './auth.model';
import { hashPassword, verifyPassword } from '@/lib/crypto/password';
import { getEnv } from '@/lib/config/env';
import { auditActions } from '@/lib/audit/audit.service';
import { getPermissionsForRole } from '@/lib/rbac/roles';

/**
 * Auth Service
 * Handles all authentication and user management operations
 */

// Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

/**
 * Generate JWT access token
 * 
 * @param {object} user - User object
 * @returns {string} JWT access token
 */
export function generateAccessToken(user) {
    const env = getEnv();

    const payload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        ownerId: user.ownerId?.toString(),
        tenantId: user.tenantId?.toString(),
        permissions: getPermissionsForRole(user.role),
    };

    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
        issuer: 'property-management',
        audience: 'property-management-api',
    });
}

/**
 * Generate refresh token
 * 
 * @returns {string} Refresh token
 */
export function generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
}

/**
 * Verify JWT access token
 * 
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token payload or null
 */
export function verifyAccessToken(token) {
    const env = getEnv();

    try {
        return jwt.verify(token, env.JWT_SECRET, {
            issuer: 'property-management',
            audience: 'property-management-api',
        });
    } catch (error) {
        throw error;
    }
}

/**
 * Calculate refresh token expiry
 * 
 * @returns {Date} Expiry date
 */
function getRefreshTokenExpiry() {
    const env = getEnv();
    const match = env.REFRESH_TOKEN_EXPIRES_IN.match(/^(\d+)([dhms])$/);

    if (!match) {
        // Default to 7 days
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const [, value, unit] = match;
    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + parseInt(value) * multipliers[unit]);
}

/**
 * Register a new user
 * 
 * @param {object} userData - User registration data
 * @param {object} context - Request context (for audit)
 * @returns {Promise<object>} Created user and tokens
 */
export async function register(userData, context = {}) {
    await connectDB();
    const User = getUserModel();

    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
        throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Create user
    const user = new User({
        email: userData.email.toLowerCase(),
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role || 'tenant',
        status: 'active', // Set to 'pending_verification' if email verification is required
        emailVerified: true, // Set to false if email verification is required
    });

    // Generate refresh token
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiry();

    user.refreshTokens.push({
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
    });

    await user.save();

    // Generate access token
    const accessToken = generateAccessToken(user);

    // Audit log
    await auditActions.userCreated(
        { id: user._id, email: user.email, role: user.role },
        user,
        context
    );

    return {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        expiresIn: getEnv().JWT_EXPIRES_IN,
    };
}

/**
 * Login user
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {object} context - Request context
 * @returns {Promise<object>} User and tokens
 */
export async function login(email, password, context = {}) {
    await connectDB();
    const User = getUserModel();

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() })
        .select('+passwordHash +refreshTokens');

    if (!user) {
        await auditActions.userLoginFailed(email, 'User not found', context);
        throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
        const remainingTime = Math.ceil((user.lockUntil - new Date()) / 1000 / 60);
        throw new Error(`Account locked. Try again in ${remainingTime} minutes`);
    }

    // Check if account is active
    if (user.status !== 'active') {
        await auditActions.userLoginFailed(email, `Account status: ${user.status}`, context);
        throw new Error('Account is not active');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
        // Increment failed attempts
        user.failedLoginAttempts += 1;

        if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
            user.lockUntil = new Date(Date.now() + LOCK_TIME);
        }

        await user.save();
        await auditActions.userLoginFailed(email, 'Invalid password', context);
        throw new Error('Invalid credentials');
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();

    // Generate new refresh token
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiry();

    // Limit stored refresh tokens (e.g., max 5 sessions)
    if (user.refreshTokens.length >= 5) {
        user.refreshTokens.shift(); // Remove oldest
    }

    user.refreshTokens.push({
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
    });

    await user.save();

    // Generate access token
    const accessToken = generateAccessToken(user);

    // Audit log
    await auditActions.userLogin(
        { id: user._id, email: user.email, role: user.role, ipAddress: context.ipAddress },
        context
    );

    return {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        expiresIn: getEnv().JWT_EXPIRES_IN,
    };
}

/**
 * Refresh access token
 * 
 * @param {string} refreshToken - Refresh token
 * @param {object} context - Request context
 * @returns {Promise<object>} New tokens
 */
export async function refreshAccessToken(refreshToken, context = {}) {
    await connectDB();
    const User = getUserModel();

    // Find user with this refresh token
    const user = await User.findOne({
        'refreshTokens.token': refreshToken,
        'refreshTokens.expiresAt': { $gt: new Date() },
    }).select('+refreshTokens');

    if (!user) {
        throw new Error('Invalid refresh token');
    }

    // Check if user is still active
    if (user.status !== 'active') {
        throw new Error('Account is not active');
    }

    // Token rotation: remove old token, add new one
    user.refreshTokens = user.refreshTokens.filter(
        (rt) => rt.token !== refreshToken
    );

    const newRefreshToken = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiry();

    user.refreshTokens.push({
        token: newRefreshToken,
        expiresAt: refreshTokenExpiry,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
    });

    await user.save();

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: getEnv().JWT_EXPIRES_IN,
    };
}

/**
 * Logout user (invalidate refresh token)
 * 
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token to invalidate
 * @param {object} context - Request context
 */
export async function logout(userId, refreshToken, context = {}) {
    await connectDB();
    const User = getUserModel();

    await User.updateOne(
        { _id: userId },
        { $pull: { refreshTokens: { token: refreshToken } } }
    );
}

/**
 * Logout from all sessions
 * 
 * @param {string} userId - User ID
 */
export async function logoutAllSessions(userId) {
    await connectDB();
    const User = getUserModel();

    await User.updateOne(
        { _id: userId },
        { $set: { refreshTokens: [] } }
    );
}

/**
 * Get user by ID
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} User object
 */
export async function getUserById(userId) {
    await connectDB();
    const User = getUserModel();

    return User.findById(userId).lean();
}

/**
 * Get user by email
 * 
 * @param {string} email - User email
 * @returns {Promise<object|null>} User object
 */
export async function getUserByEmail(email) {
    await connectDB();
    const User = getUserModel();

    return User.findOne({ email: email.toLowerCase() }).lean();
}

/**
 * Update user profile
 * 
 * @param {string} userId - User ID
 * @param {object} updates - Profile updates
 * @returns {Promise<object>} Updated user
 */
export async function updateProfile(userId, updates) {
    await connectDB();
    const User = getUserModel();

    const allowedUpdates = ['firstName', 'lastName', 'phone'];
    const filteredUpdates = {};

    for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
            filteredUpdates[key] = updates[key];
        }
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: filteredUpdates },
        { new: true, runValidators: true }
    ).lean();

    return user;
}

/**
 * Change user password
 * 
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {object} context - Request context
 */
export async function changePassword(userId, currentPassword, newPassword, context = {}) {
    await connectDB();
    const User = getUserModel();

    const user = await User.findById(userId).select('+passwordHash +refreshTokens');

    if (!user) {
        throw new Error('User not found');
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);

    if (!isValid) {
        throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password and invalidate all refresh tokens
    user.passwordHash = newPasswordHash;
    user.lastPasswordChange = new Date();
    user.refreshTokens = []; // Force re-login on all devices

    await user.save();
}

/**
 * Create a user (admin function)
 * 
 * @param {object} userData - User data
 * @param {object} creator - User creating the account
 * @param {object} context - Request context
 * @returns {Promise<object>} Created user
 */
export async function createUser(userData, creator, context = {}) {
    await connectDB();
    const User = getUserModel();

    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
        throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Create user
    const user = new User({
        email: userData.email.toLowerCase(),
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        status: userData.status || 'active',
        ownerId: userData.ownerId,
        tenantId: userData.tenantId,
        emailVerified: true,
        createdBy: creator.id,
    });

    await user.save();

    // Audit log
    await auditActions.userCreated(creator, user, context);

    return user.toJSON();
}

/**
 * Update user role (admin function)
 * 
 * @param {string} userId - User ID
 * @param {string} newRole - New role
 * @param {object} actor - Admin performing the change
 * @param {object} context - Request context
 */
export async function updateUserRole(userId, newRole, actor, context = {}) {
    await connectDB();
    const User = getUserModel();

    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const oldRole = user.role;
    user.role = newRole;
    user.updatedBy = actor.id;

    // Invalidate all sessions when role changes
    user.refreshTokens = [];

    await user.save();

    // Audit log
    await auditActions.userRoleChanged(actor, user, oldRole, newRole, context);

    return user.toJSON();
}

/**
 * Update user status (admin function)
 * 
 * @param {string} userId - User ID
 * @param {string} status - New status
 * @param {object} actor - Admin performing the change
 */
export async function updateUserStatus(userId, status, actor) {
    await connectDB();
    const User = getUserModel();

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                status,
                updatedBy: actor.id,
            },
            // Clear sessions if suspending
            ...(status === 'suspended' ? { refreshTokens: [] } : {}),
        },
        { new: true }
    ).lean();

    return user;
}

/**
 * List users with pagination and filters
 * 
 * @param {object} filters - Query filters
 * @param {object} options - Pagination options
 * @returns {Promise<object>} Paginated users
 */
export async function listUsers(filters = {}, options = {}) {
    await connectDB();
    const User = getUserModel();

    const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = options;

    const query = {};

    if (filters.role) {
        query.role = filters.role;
    }

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.search) {
        query.$or = [
            { email: { $regex: filters.search, $options: 'i' } },
            { firstName: { $regex: filters.search, $options: 'i' } },
            { lastName: { $regex: filters.search, $options: 'i' } },
        ];
    }

    const [users, total] = await Promise.all([
        User.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        User.countDocuments(query),
    ]);

    return {
        data: users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}

/**
 * Delete user (admin function)
 * 
 * @param {string} userId - User ID
 * @param {object} actor - Admin performing the deletion
 */
export async function deleteUser(userId, actor) {
    await connectDB();
    const User = getUserModel();

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
        throw new Error('User not found');
    }

    return user;
}

export default {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    register,
    login,
    refreshAccessToken,
    logout,
    logoutAllSessions,
    getUserById,
    getUserByEmail,
    updateProfile,
    changePassword,
    createUser,
    updateUserRole,
    updateUserStatus,
    listUsers,
    deleteUser,
};
