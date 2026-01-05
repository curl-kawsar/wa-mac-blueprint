import { z } from 'zod';

/**
 * Zod validation schemas for Properties module
 */

// Address schema
const addressSchema = z.object({
    street: z.string().min(1, 'Street is required').max(255),
    unit: z.string().max(50).optional(),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().min(1, 'State is required').max(50),
    zipCode: z.string().min(1, 'Zip code is required').max(20),
    country: z.string().max(100).default('USA'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

// Property details schema
const propertyDetailsSchema = z.object({
    yearBuilt: z.number().int().min(1800).max(2100).optional(),
    squareFeet: z.number().positive().optional(),
    lotSize: z.number().positive().optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().min(0).optional(),
    parking: z.enum(['garage', 'carport', 'street', 'none']).optional(),
    parkingSpaces: z.number().int().min(0).optional(),
    amenities: z.array(z.string()).optional(),
    description: z.string().max(5000).optional(),
});

// HOA schema
const hoaSchema = z.object({
    name: z.string().max(255).optional(),
    contactPhone: z.string().max(20).optional(),
    contactEmail: z.string().email().optional(),
    monthlyDues: z.number().min(0).optional(),
    dueDate: z.number().int().min(1).max(31).optional(),
});

// Insurance schema
const insuranceSchema = z.object({
    provider: z.string().max(255).optional(),
    policyNumber: z.string().max(100).optional(),
    expirationDate: z.string().datetime().optional(),
    coverageAmount: z.number().min(0).optional(),
});

/**
 * Create property schema
 */
export const createPropertySchema = z.object({
    name: z.string().min(1, 'Property name is required').max(255).trim(),
    propertyType: z.enum([
        'single_family',
        'multi_family',
        'apartment',
        'condo',
        'townhouse',
        'commercial',
        'mixed_use',
    ]).default('single_family'),
    address: addressSchema,
    details: propertyDetailsSchema.optional(),
    status: z.enum(['active', 'inactive', 'under_maintenance', 'sold', 'pending']).default('pending'),
    managementStatus: z.enum(['managed', 'unmanaged', 'onboarding', 'offboarding']).default('onboarding'),
    hoa: hoaSchema.optional(),
    insurance: insuranceSchema.optional(),
    taxInfo: z.object({
        parcelNumber: z.string().max(100).optional(),
        annualTaxes: z.number().min(0).optional(),
        taxYear: z.number().int().min(2000).max(2100).optional(),
    }).optional(),
});

/**
 * Update property schema
 */
export const updatePropertySchema = createPropertySchema.partial();

/**
 * Query properties schema
 */
export const queryPropertiesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['active', 'inactive', 'under_maintenance', 'sold', 'pending']).optional(),
    propertyType: z.enum([
        'single_family',
        'multi_family',
        'apartment',
        'condo',
        'townhouse',
        'commercial',
        'mixed_use',
    ]).optional(),
    managementStatus: z.enum(['managed', 'unmanaged', 'onboarding', 'offboarding']).optional(),
    ownerId: z.string().optional(),
    search: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(50).optional(),
    sortBy: z.enum(['createdAt', 'name', 'address.city']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Unit rental schema
const rentalSchema = z.object({
    marketRent: z.number().positive('Market rent must be positive'),
    depositAmount: z.number().min(0).optional(),
    petDeposit: z.number().min(0).optional(),
    petRent: z.number().min(0).optional(),
    petsAllowed: z.boolean().default(false),
    smokingAllowed: z.boolean().default(false),
});

// Unit details schema
const unitDetailsSchema = z.object({
    squareFeet: z.number().positive().optional(),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().min(0).optional(),
    floor: z.number().int().optional(),
    amenities: z.array(z.string()).optional(),
    description: z.string().max(5000).optional(),
});

/**
 * Create unit schema
 */
export const createUnitSchema = z.object({
    propertyId: z.string().min(1, 'Property ID is required'),
    unitNumber: z.string().min(1, 'Unit number is required').max(50).trim(),
    unitType: z.enum(['apartment', 'house', 'studio', 'room', 'commercial', 'storage']).default('apartment'),
    details: unitDetailsSchema.optional(),
    rental: rentalSchema,
    status: z.enum(['vacant', 'occupied', 'maintenance', 'reserved', 'unavailable']).default('vacant'),
    availableFrom: z.string().datetime().optional(),
});

/**
 * Update unit schema
 */
export const updateUnitSchema = createUnitSchema.omit({ propertyId: true }).partial();

/**
 * Query units schema
 */
export const queryUnitsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    propertyId: z.string().optional(),
    status: z.enum(['vacant', 'occupied', 'maintenance', 'reserved', 'unavailable']).optional(),
    unitType: z.enum(['apartment', 'house', 'studio', 'room', 'commercial', 'storage']).optional(),
    minRent: z.coerce.number().min(0).optional(),
    maxRent: z.coerce.number().min(0).optional(),
    bedrooms: z.coerce.number().int().min(0).optional(),
    sortBy: z.enum(['createdAt', 'unitNumber', 'rental.marketRent']).default('unitNumber'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Property assignment schema
 */
export const createAssignmentSchema = z.object({
    propertyId: z.string().min(1, 'Property ID is required'),
    ownerId: z.string().min(1, 'Owner ID is required'),
    ownershipPercent: z.number().min(0).max(100).default(100),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isPrimary: z.boolean().default(false),
    managementFeeOverride: z.number().min(0).max(100).optional(),
    notes: z.string().max(1000).optional(),
});

/**
 * Update assignment schema
 */
export const updateAssignmentSchema = createAssignmentSchema
    .omit({ propertyId: true, ownerId: true })
    .partial();

/**
 * Add note schema
 */
export const addNoteSchema = z.object({
    content: z.string().min(1, 'Note content is required').max(5000),
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
    createPropertySchema,
    updatePropertySchema,
    queryPropertiesSchema,
    createUnitSchema,
    updateUnitSchema,
    queryUnitsSchema,
    createAssignmentSchema,
    updateAssignmentSchema,
    addNoteSchema,
    validate,
};
