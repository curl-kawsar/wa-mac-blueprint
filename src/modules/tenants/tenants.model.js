import mongoose from 'mongoose';

/**
 * Tenant Application Schema
 * Represents a rental application from a prospective tenant
 */
const tenantApplicationSchema = new mongoose.Schema(
    {
        // Applicant Information
        applicant: {
            firstName: { type: String, required: true, trim: true },
            lastName: { type: String, required: true, trim: true },
            email: { type: String, required: true, lowercase: true, trim: true },
            phone: { type: String, required: true },
            dateOfBirth: Date,
        },

        // Co-applicants
        coApplicants: [{
            firstName: { type: String, trim: true },
            lastName: { type: String, trim: true },
            email: { type: String, lowercase: true },
            phone: String,
            relationship: String,
            dateOfBirth: Date,
        }],

        // Desired unit
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
        },

        unit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unit',
            required: true,
        },

        desiredMoveInDate: {
            type: Date,
            required: true,
        },

        desiredLeaseTerm: {
            type: Number, // months
            default: 12,
        },

        // Current residence
        currentAddress: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            monthlyRent: Number,
            moveInDate: Date,
            reasonForLeaving: String,
        },

        // Landlord references
        landlordReferences: [{
            name: String,
            phone: String,
            email: String,
            propertyAddress: String,
            relationshipDuration: String,
            contacted: { type: Boolean, default: false },
            contactedAt: Date,
            feedback: String,
            rating: Number,
        }],

        // Employment info
        employment: {
            status: {
                type: String,
                enum: ['employed', 'self_employed', 'unemployed', 'retired', 'student'],
            },
            employer: String,
            position: String,
            monthlyIncome: Number,
            startDate: Date,
            supervisorName: String,
            supervisorPhone: String,
            verified: { type: Boolean, default: false },
            verifiedAt: Date,
        },

        // Additional income sources
        additionalIncome: [{
            source: String,
            monthlyAmount: Number,
            verified: { type: Boolean, default: false },
        }],

        // Pets
        pets: [{
            type: { type: String },
            breed: String,
            weight: Number,
            name: String,
            age: Number,
        }],

        // Vehicles
        vehicles: [{
            make: String,
            model: String,
            year: Number,
            licensePlate: String,
            state: String,
        }],

        // Emergency contact
        emergencyContact: {
            name: String,
            relationship: String,
            phone: String,
            email: String,
        },

        // Screening
        screening: {
            status: {
                type: String,
                enum: ['pending', 'in_progress', 'completed', 'failed'],
                default: 'pending',
            },
            creditCheck: {
                status: {
                    type: String,
                    enum: ['pending', 'passed', 'failed', 'conditional'],
                },
                score: Number,
                completedAt: Date,
                notes: String,
            },
            backgroundCheck: {
                status: {
                    type: String,
                    enum: ['pending', 'passed', 'failed', 'conditional'],
                },
                completedAt: Date,
                notes: String,
            },
            incomeVerification: {
                status: {
                    type: String,
                    enum: ['pending', 'passed', 'failed', 'conditional'],
                },
                completedAt: Date,
                incomeToRentRatio: Number,
                notes: String,
            },
            landlordVerification: {
                status: {
                    type: String,
                    enum: ['pending', 'passed', 'failed', 'conditional'],
                },
                completedAt: Date,
                notes: String,
            },
        },

        // Application status
        status: {
            type: String,
            enum: [
                'draft',
                'submitted',
                'screening',
                'approved',
                'conditionally_approved',
                'denied',
                'withdrawn',
                'expired',
            ],
            default: 'draft',
            index: true,
        },

        // Decision
        decision: {
            status: {
                type: String,
                enum: ['approved', 'conditionally_approved', 'denied'],
            },
            decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            decidedAt: Date,
            reason: String,
            conditions: [String],
        },

        // Application fee
        applicationFee: {
            amount: Number,
            paidAt: Date,
            paymentMethod: String,
            transactionId: String,
        },

        // Documents
        documents: [{
            documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
            type: {
                type: String,
                enum: ['id', 'income', 'bank_statement', 'reference', 'other'],
            },
            name: String,
            uploadedAt: { type: Date, default: Date.now },
        }],

        // Notes
        internalNotes: [{
            content: String,
            createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            createdAt: { type: Date, default: Date.now },
        }],

        // Metadata
        submittedAt: Date,
        expiresAt: Date,

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
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for full name
tenantApplicationSchema.virtual('fullName').get(function () {
    return `${this.applicant.firstName} ${this.applicant.lastName}`;
});

// Index
tenantApplicationSchema.index({ 'applicant.email': 1 });
tenantApplicationSchema.index({ property: 1, unit: 1, status: 1 });
tenantApplicationSchema.index({ status: 1, createdAt: -1 });

/**
 * Tenant Profile Schema
 * Represents an active or past tenant
 */
const tenantSchema = new mongoose.Schema(
    {
        // Basic Information
        firstName: {
            type: String,
            required: true,
            trim: true,
        },

        lastName: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        phone: {
            type: String,
            required: true,
        },

        alternatePhone: String,

        dateOfBirth: Date,

        // SSN (encrypted)
        ssnEncrypted: {
            type: String,
            select: false,
        },

        ssnLast4: String,

        // Linked user account
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true,
            sparse: true,
            index: true,
        },

        // Original application reference
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TenantApplication',
        },

        // Emergency contacts
        emergencyContacts: [{
            name: { type: String, required: true },
            relationship: String,
            phone: { type: String, required: true },
            email: String,
            isPrimary: { type: Boolean, default: false },
        }],

        // Vehicles registered
        vehicles: [{
            make: String,
            model: String,
            year: Number,
            color: String,
            licensePlate: String,
            state: String,
            parkingSpot: String,
        }],

        // Pets registered
        pets: [{
            type: { type: String },
            breed: String,
            name: String,
            weight: Number,
            registrationDate: Date,
            petDeposit: Number,
            monthlyRent: Number,
        }],

        // Occupants (other than leaseholder)
        occupants: [{
            firstName: String,
            lastName: String,
            relationship: String,
            dateOfBirth: Date,
            isOnLease: { type: Boolean, default: false },
        }],

        // Status
        status: {
            type: String,
            enum: ['active', 'inactive', 'evicted', 'moved_out'],
            default: 'active',
            index: true,
        },

        // Current lease (for quick access)
        currentLease: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lease',
        },

        // Current unit (for quick access)
        currentUnit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unit',
        },

        // Move-in/out dates
        moveInDate: Date,
        moveOutDate: Date,

        // Communication preferences
        preferences: {
            emailNotifications: { type: Boolean, default: true },
            smsNotifications: { type: Boolean, default: false },
            preferredContactMethod: {
                type: String,
                enum: ['email', 'phone', 'sms'],
                default: 'email',
            },
        },

        // Internal notes
        internalNotes: [{
            content: String,
            createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            createdAt: { type: Date, default: Date.now },
        }],

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
                delete ret.ssnEncrypted;
                delete ret.__v;
                return ret;
            },
        },
        toObject: { virtuals: true },
    }
);

// Virtual for full name
tenantSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Indexes
tenantSchema.index({ firstName: 1, lastName: 1 });

/**
 * Get the TenantApplication model
 */
export function getTenantApplicationModel() {
    return mongoose.models.TenantApplication || mongoose.model('TenantApplication', tenantApplicationSchema);
}

/**
 * Get the Tenant model
 */
export function getTenantModel() {
    return mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
}

export default {
    getTenantApplicationModel,
    getTenantModel,
};
