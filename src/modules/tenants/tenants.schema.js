import { z } from 'zod';

/**
 * Zod validation schemas for Tenants module
 */

// Applicant schema
const applicantSchema = z.object({
    firstName: z.string().min(1).max(50).trim(),
    lastName: z.string().min(1).max(50).trim(),
    email: z.string().email().transform((v) => v.toLowerCase().trim()),
    phone: z.string().min(1).max(20),
    dateOfBirth: z.string().datetime().optional(),
});

// Co-applicant schema
const coApplicantSchema = z.object({
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    relationship: z.string().max(50).optional(),
    dateOfBirth: z.string().datetime().optional(),
});

// Address schema
const addressSchema = z.object({
    street: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(50).optional(),
    zipCode: z.string().max(20).optional(),
    monthlyRent: z.number().min(0).optional(),
    moveInDate: z.string().datetime().optional(),
    reasonForLeaving: z.string().max(500).optional(),
});

// Employment schema
const employmentSchema = z.object({
    status: z.enum(['employed', 'self_employed', 'unemployed', 'retired', 'student']),
    employer: z.string().max(255).optional(),
    position: z.string().max(100).optional(),
    monthlyIncome: z.number().min(0).optional(),
    startDate: z.string().datetime().optional(),
    supervisorName: z.string().max(100).optional(),
    supervisorPhone: z.string().max(20).optional(),
});

// Pet schema
const petSchema = z.object({
    type: z.string().max(50),
    breed: z.string().max(100).optional(),
    weight: z.number().min(0).optional(),
    name: z.string().max(50).optional(),
    age: z.number().int().min(0).optional(),
});

// Vehicle schema
const vehicleSchema = z.object({
    make: z.string().max(50).optional(),
    model: z.string().max(50).optional(),
    year: z.number().int().min(1900).max(2100).optional(),
    licensePlate: z.string().max(20).optional(),
    state: z.string().max(10).optional(),
});

// Emergency contact schema
const emergencyContactSchema = z.object({
    name: z.string().min(1).max(100),
    relationship: z.string().max(50).optional(),
    phone: z.string().min(1).max(20),
    email: z.string().email().optional(),
});

// Landlord reference schema
const landlordReferenceSchema = z.object({
    name: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    email: z.string().email().optional(),
    propertyAddress: z.string().max(255).optional(),
    relationshipDuration: z.string().max(50).optional(),
});

/**
 * Create tenant application schema
 */
export const createApplicationSchema = z.object({
    applicant: applicantSchema,
    coApplicants: z.array(coApplicantSchema).optional(),
    propertyId: z.string().min(1),
    unitId: z.string().min(1),
    desiredMoveInDate: z.string().datetime(),
    desiredLeaseTerm: z.number().int().min(1).max(60).default(12),
    currentAddress: addressSchema.optional(),
    landlordReferences: z.array(landlordReferenceSchema).optional(),
    employment: employmentSchema.optional(),
    pets: z.array(petSchema).optional(),
    vehicles: z.array(vehicleSchema).optional(),
    emergencyContact: emergencyContactSchema.optional(),
});

/**
 * Update application schema
 */
export const updateApplicationSchema = createApplicationSchema.partial();

/**
 * Submit application schema
 */
export const submitApplicationSchema = z.object({
    agreesToTerms: z.literal(true, {
        errorMap: () => ({ message: 'You must agree to the terms' }),
    }),
});

/**
 * Screening update schema
 */
export const updateScreeningSchema = z.object({
    type: z.enum(['creditCheck', 'backgroundCheck', 'incomeVerification', 'landlordVerification']),
    status: z.enum(['pending', 'passed', 'failed', 'conditional']),
    notes: z.string().max(1000).optional(),
    score: z.number().optional(), // for credit check
    incomeToRentRatio: z.number().optional(), // for income verification
});

/**
 * Application decision schema
 */
export const applicationDecisionSchema = z.object({
    status: z.enum(['approved', 'conditionally_approved', 'denied']),
    reason: z.string().max(1000).optional(),
    conditions: z.array(z.string()).optional(),
});

/**
 * Query applications schema
 */
export const queryApplicationsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum([
        'draft',
        'submitted',
        'screening',
        'approved',
        'conditionally_approved',
        'denied',
        'withdrawn',
        'expired',
    ]).optional(),
    propertyId: z.string().optional(),
    unitId: z.string().optional(),
    search: z.string().max(100).optional(),
    sortBy: z.enum(['createdAt', 'submittedAt', 'applicant.lastName']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Create tenant schema (from approved application)
 */
export const createTenantSchema = z.object({
    applicationId: z.string().min(1),
    moveInDate: z.string().datetime(),
});

/**
 * Update tenant schema
 */
export const updateTenantSchema = z.object({
    firstName: z.string().min(1).max(50).trim().optional(),
    lastName: z.string().min(1).max(50).trim().optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    alternatePhone: z.string().max(20).optional(),
    preferences: z.object({
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        preferredContactMethod: z.enum(['email', 'phone', 'sms']).optional(),
    }).optional(),
});

/**
 * Add emergency contact schema
 */
export const addEmergencyContactSchema = emergencyContactSchema.extend({
    isPrimary: z.boolean().default(false),
});

/**
 * Add occupant schema
 */
export const addOccupantSchema = z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    relationship: z.string().max(50).optional(),
    dateOfBirth: z.string().datetime().optional(),
    isOnLease: z.boolean().default(false),
});

/**
 * Add pet schema
 */
export const addPetSchema = petSchema.extend({
    registrationDate: z.string().datetime().optional(),
    petDeposit: z.number().min(0).optional(),
    monthlyRent: z.number().min(0).optional(),
});

/**
 * Add vehicle schema
 */
export const addVehicleSchema = vehicleSchema.extend({
    color: z.string().max(30).optional(),
    parkingSpot: z.string().max(20).optional(),
});

/**
 * Query tenants schema
 */
export const queryTenantsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['active', 'inactive', 'evicted', 'moved_out']).optional(),
    propertyId: z.string().optional(),
    search: z.string().max(100).optional(),
    sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'moveInDate']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Add note schema
 */
export const addNoteSchema = z.object({
    content: z.string().min(1).max(5000),
});

/**
 * Validate helper
 */
export function validate(schema, data) {
    const result = schema.safeParse(data);

    if (!result.success) {
        const errors = result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }));

        return { success: false, errors, data: null };
    }

    return { success: true, errors: null, data: result.data };
}

export default {
    createApplicationSchema,
    updateApplicationSchema,
    submitApplicationSchema,
    updateScreeningSchema,
    applicationDecisionSchema,
    queryApplicationsSchema,
    createTenantSchema,
    updateTenantSchema,
    addEmergencyContactSchema,
    addOccupantSchema,
    addPetSchema,
    addVehicleSchema,
    queryTenantsSchema,
    addNoteSchema,
    validate,
};
