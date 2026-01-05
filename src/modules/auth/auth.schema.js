import { z } from 'zod';
import { ROLES } from '@/lib/rbac/roles';

/**
 * Zod validation schemas for Auth module
 */

// Password requirements
const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

// Email validation
const emailSchema = z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .transform((val) => val.toLowerCase().trim());

// Phone validation (optional)
const phoneSchema = z
    .string()
    .regex(/^\+?[\d\s\-().]+$/, 'Invalid phone number format')
    .optional()
    .or(z.literal(''));

/**
 * Register user schema
 */
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: z
        .string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .trim(),
    lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters')
        .trim(),
    phone: phoneSchema,
    role: z.enum(Object.values(ROLES)).optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

/**
 * Login schema
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
    firstName: z
        .string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .trim()
        .optional(),
    lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters')
        .trim()
        .optional(),
    phone: phoneSchema,
});

/**
 * Create user schema (admin only)
 */
export const createUserSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z
        .string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .trim(),
    lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters')
        .trim(),
    phone: phoneSchema,
    role: z.enum(Object.values(ROLES)),
    status: z.enum(['active', 'inactive', 'suspended', 'pending_verification']).optional(),
    ownerId: z.string().optional(),
    tenantId: z.string().optional(),
});

/**
 * Update user role schema (admin only)
 */
export const updateUserRoleSchema = z.object({
    role: z.enum(Object.values(ROLES)),
});

/**
 * Update user status schema (admin only)
 */
export const updateUserStatusSchema = z.object({
    status: z.enum(['active', 'inactive', 'suspended', 'pending_verification']),
});

/**
 * Validate request body against a schema
 * 
 * @param {object} schema - Zod schema
 * @param {object} data - Data to validate
 * @returns {object} Validation result
 */
export function validate(schema, data) {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors = result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }));

        return {
            success: false,
            errors,
            data: null,
        };
    }

    return {
        success: true,
        errors: null,
        data: result.data,
    };
}

export default {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    createUserSchema,
    updateUserRoleSchema,
    updateUserStatusSchema,
    validate,
};
