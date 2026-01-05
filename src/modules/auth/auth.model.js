import mongoose from 'mongoose';
import { ROLES } from '@/lib/rbac/roles';

/**
 * User Schema
 * Core authentication entity for all system users
 */
const userSchema = new mongoose.Schema(
    {
        // Basic info
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        passwordHash: {
            type: String,
            required: [true, 'Password is required'],
            select: false, // Never return password by default
        },

        // Profile
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: 50,
        },

        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            maxlength: 50,
        },

        phone: {
            type: String,
            trim: true,
        },

        // Role and permissions
        role: {
            type: String,
            enum: Object.values(ROLES),
            default: ROLES.TENANT,
            index: true,
        },

        // Account status
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended', 'pending_verification'],
            default: 'pending_verification',
            index: true,
        },

        // Email verification
        emailVerified: {
            type: Boolean,
            default: false,
        },

        emailVerificationToken: {
            type: String,
            select: false,
        },

        emailVerificationExpires: {
            type: Date,
            select: false,
        },

        // Password reset
        passwordResetToken: {
            type: String,
            select: false,
        },

        passwordResetExpires: {
            type: Date,
            select: false,
        },

        // Refresh tokens (for session management)
        refreshTokens: [
            {
                token: {
                    type: String,
                    required: true,
                },
                expiresAt: {
                    type: Date,
                    required: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
                userAgent: String,
                ipAddress: String,
            },
        ],

        // Linked entities (for scoped access)
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Owner',
            index: true,
        },

        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            index: true,
        },

        // Security
        failedLoginAttempts: {
            type: Number,
            default: 0,
        },

        lockUntil: {
            type: Date,
        },

        lastLogin: {
            type: Date,
        },

        lastPasswordChange: {
            type: Date,
        },

        // Two-factor auth (future)
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },

        twoFactorSecret: {
            type: String,
            select: false,
        },

        // Metadata
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                delete ret.passwordHash;
                delete ret.refreshTokens;
                delete ret.emailVerificationToken;
                delete ret.passwordResetToken;
                delete ret.twoFactorSecret;
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
        },
    }
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual to check if account is locked
userSchema.virtual('isLocked').get(function () {
    return this.lockUntil && this.lockUntil > new Date();
});

// Index for finding users with valid refresh tokens
userSchema.index({ 'refreshTokens.token': 1 });

// Clean up expired refresh tokens before saving
userSchema.pre('save', function (next) {
    if (this.refreshTokens && this.refreshTokens.length > 0) {
        const now = new Date();
        this.refreshTokens = this.refreshTokens.filter(
            (rt) => rt.expiresAt > now
        );
    }
    next();
});

// Static method to find user for authentication
userSchema.statics.findForAuth = function (email) {
    return this.findOne({ email: email.toLowerCase() })
        .select('+passwordHash')
        .lean();
};

// Static method to check if email exists
userSchema.statics.emailExists = async function (email) {
    const count = await this.countDocuments({ email: email.toLowerCase() });
    return count > 0;
};

/**
 * Get the User model
 * Handles model caching for hot reload
 */
export function getUserModel() {
    return mongoose.models.User || mongoose.model('User', userSchema);
}

export default getUserModel;
