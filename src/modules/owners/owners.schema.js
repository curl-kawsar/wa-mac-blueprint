import { z } from 'zod';

/**
 * Zod validation schemas for Owners module
 */

// Address schema
const addressSchema = z.object({
    street: z.string().max(255).optional(),
    unit: z.string().max(50).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(50).optional(),
    zipCode: z.string().max(20).optional(),
    country: z.string().max(100).default('USA'),
});

// SSN validation (accepts various formats)
const ssnSchema = z
    .string()
    .regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Invalid SSN format')
    .transform((val) => val.replace(/-/g, ''));

// EIN validation
const einSchema = z
    .string()
    .regex(/^\d{2}-?\d{7}$/, 'Invalid EIN format')
    .transform((val) => val.replace(/-/g, ''));

// Bank account schema
const bankInfoSchema = z.object({
    routingNumber: z
        .string()
        .length(9, 'Routing number must be 9 digits')
        .regex(/^\d+$/, 'Routing number must contain only digits'),
    accountNumber: z
        .string()
        .min(4, 'Account number must be at least 4 digits')
        .max(17, 'Account number must be at most 17 digits')
        .regex(/^\d+$/, 'Account number must contain only digits'),
    accountType: z.enum(['checking', 'savings']).default('checking'),
    bankName: z.string().max(100).optional(),
});

// W9 schema
const w9Schema = z.object({
    receivedDate: z.string().datetime().optional(),
    taxYear: z.number().int().min(2000).max(2100).optional(),
    businessName: z.string().max(255).optional(),
    businessType: z.enum([
        'individual',
        'sole_proprietor',
        'llc_single',
        'llc_multi',
        'c_corp',
        's_corp',
        'partnership',
        'trust',
    ]).optional(),
});

// Preferences schema
const preferencesSchema = z.object({
    emailNotifications: z.boolean().default(true),
    smsNotifications: z.boolean().default(false),
    statementFrequency: z.enum(['monthly', 'quarterly', 'annually']).default('monthly'),
    preferredContactMethod: z.enum(['email', 'phone', 'sms']).default('email'),
});

/**
 * Create owner schema
 */
export const createOwnerSchema = z.object({
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
    email: z
        .string()
        .email('Invalid email address')
        .max(255)
        .transform((val) => val.toLowerCase().trim()),
    phone: z.string().max(20).optional(),
    alternatePhone: z.string().max(20).optional(),
    address: addressSchema.optional(),

    // Tax info (optional at creation, required for payouts)
    taxIdType: z.enum(['ssn', 'ein', 'itin']).optional(),
    ssn: ssnSchema.optional(),
    ein: einSchema.optional(),

    // Bank info (optional at creation, required for payouts)
    bankInfo: bankInfoSchema.optional(),

    // W9 info
    w9: w9Schema.optional(),

    // Preferences
    preferences: preferencesSchema.optional(),

    // Contract info
    managementFeePercent: z.number().min(0).max(100).default(10),
    contractStartDate: z.string().datetime().optional(),
    contractEndDate: z.string().datetime().optional(),

    // Status
    status: z.enum(['active', 'inactive', 'pending', 'suspended']).default('pending'),
});

/**
 * Update owner schema
 */
export const updateOwnerSchema = z.object({
    firstName: z.string().min(1).max(50).trim().optional(),
    lastName: z.string().min(1).max(50).trim().optional(),
    email: z.string().email().max(255).transform((val) => val.toLowerCase().trim()).optional(),
    phone: z.string().max(20).optional(),
    alternatePhone: z.string().max(20).optional(),
    address: addressSchema.optional(),
    preferences: preferencesSchema.partial().optional(),
    status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
    managementFeePercent: z.number().min(0).max(100).optional(),
});

/**
 * Update tax info schema
 */
export const updateTaxInfoSchema = z.object({
    taxIdType: z.enum(['ssn', 'ein', 'itin']),
    ssn: ssnSchema.optional(),
    ein: einSchema.optional(),
}).refine(
    (data) => {
        if (data.taxIdType === 'ssn' || data.taxIdType === 'itin') {
            return !!data.ssn;
        }
        if (data.taxIdType === 'ein') {
            return !!data.ein;
        }
        return true;
    },
    { message: 'Tax ID is required for the selected type' }
);

/**
 * Update bank info schema
 */
export const updateBankInfoSchema = bankInfoSchema.extend({
    paymentMethod: z.enum(['ach', 'check', 'wire']).default('ach'),
});

/**
 * Add internal note schema
 */
export const addNoteSchema = z.object({
    content: z.string().min(1, 'Note content is required').max(5000),
});

/**
 * Query parameters schema
 */
export const queryOwnersSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
    search: z.string().max(100).optional(),
    sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'email']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Validate request body against a schema
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
    createOwnerSchema,
    updateOwnerSchema,
    updateTaxInfoSchema,
    updateBankInfoSchema,
    addNoteSchema,
    queryOwnersSchema,
    validate,
};
