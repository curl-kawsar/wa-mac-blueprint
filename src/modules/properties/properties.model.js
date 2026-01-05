import mongoose from 'mongoose';

/**
 * Property Schema
 * Represents a property in the system
 */
const propertySchema = new mongoose.Schema(
    {
        // Basic Information
        name: {
            type: String,
            required: [true, 'Property name is required'],
            trim: true,
            maxlength: 255,
        },

        // Property type
        propertyType: {
            type: String,
            enum: [
                'single_family',
                'multi_family',
                'apartment',
                'condo',
                'townhouse',
                'commercial',
                'mixed_use',
            ],
            default: 'single_family',
            index: true,
        },

        // Address
        address: {
            street: { type: String, required: true, trim: true },
            unit: { type: String, trim: true },
            city: { type: String, required: true, trim: true },
            state: { type: String, required: true, trim: true },
            zipCode: { type: String, required: true, trim: true },
            country: { type: String, default: 'USA' },
            latitude: Number,
            longitude: Number,
        },

        // Property details
        details: {
            yearBuilt: Number,
            squareFeet: Number,
            lotSize: Number,
            bedrooms: Number,
            bathrooms: Number,
            parking: {
                type: String,
                enum: ['garage', 'carport', 'street', 'none'],
            },
            parkingSpaces: Number,
            amenities: [String],
            description: String,
        },

        // Status
        status: {
            type: String,
            enum: ['active', 'inactive', 'under_maintenance', 'sold', 'pending'],
            default: 'pending',
            index: true,
        },

        // Management status
        managementStatus: {
            type: String,
            enum: ['managed', 'unmanaged', 'onboarding', 'offboarding'],
            default: 'onboarding',
        },

        // Acquisition info
        acquisition: {
            purchaseDate: Date,
            purchasePrice: Number,
            currentValue: Number,
            lastValuationDate: Date,
        },

        // Insurance info
        insurance: {
            provider: String,
            policyNumber: String,
            expirationDate: Date,
            coverageAmount: Number,
        },

        // HOA info (if applicable)
        hoa: {
            name: String,
            contactPhone: String,
            contactEmail: String,
            monthlyDues: Number,
            dueDate: Number, // Day of month
        },

        // Primary photos
        photos: [{
            url: String,
            caption: String,
            isPrimary: Boolean,
            order: Number,
        }],

        // Documents
        documents: [{
            documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
            type: {
                type: String,
                enum: ['deed', 'insurance', 'inspection', 'tax', 'hoa', 'other'],
            },
            name: String,
        }],

        // Internal notes (admin only)
        internalNotes: [{
            content: { type: String, required: true },
            createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            createdAt: { type: Date, default: Date.now },
        }],

        // Tax info
        taxInfo: {
            parcelNumber: String,
            annualTaxes: Number,
            taxYear: Number,
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
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for full address
propertySchema.virtual('fullAddress').get(function () {
    const addr = this.address;
    if (!addr) return '';
    let address = addr.street;
    if (addr.unit) address += ` ${addr.unit}`;
    address += `, ${addr.city}, ${addr.state} ${addr.zipCode}`;
    return address;
});

// Virtual for unit count
propertySchema.virtual('unitCount', {
    ref: 'Unit',
    localField: '_id',
    foreignField: 'property',
    count: true,
});

// Indexes
propertySchema.index({ 'address.city': 1, 'address.state': 1 });
propertySchema.index({ 'address.zipCode': 1 });
propertySchema.index({ name: 'text', 'address.street': 'text', 'address.city': 'text' });

/**
 * Unit Schema
 * Represents a rentable unit within a property
 */
const unitSchema = new mongoose.Schema(
    {
        // Parent property
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
            index: true,
        },

        // Unit identifier
        unitNumber: {
            type: String,
            required: [true, 'Unit number is required'],
            trim: true,
        },

        // Unit type
        unitType: {
            type: String,
            enum: ['apartment', 'house', 'studio', 'room', 'commercial', 'storage'],
            default: 'apartment',
        },

        // Unit details
        details: {
            squareFeet: Number,
            bedrooms: Number,
            bathrooms: Number,
            floor: Number,
            amenities: [String],
            description: String,
        },

        // Rental info
        rental: {
            marketRent: {
                type: Number,
                required: true,
            },
            depositAmount: Number,
            petDeposit: Number,
            petRent: Number,
            petsAllowed: { type: Boolean, default: false },
            smokingAllowed: { type: Boolean, default: false },
        },

        // Status
        status: {
            type: String,
            enum: ['vacant', 'occupied', 'maintenance', 'reserved', 'unavailable'],
            default: 'vacant',
            index: true,
        },

        // Current lease reference (populated when occupied)
        currentLease: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lease',
        },

        // Current tenant (for quick access)
        currentTenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
        },

        // Vacancy dates
        lastVacatedAt: Date,
        availableFrom: Date,

        // Photos
        photos: [{
            url: String,
            caption: String,
            isPrimary: Boolean,
            order: Number,
        }],

        // Move-in/out checklist
        moveInCondition: {
            documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
            completedAt: Date,
            notes: String,
        },

        moveOutCondition: {
            documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
            completedAt: Date,
            notes: String,
        },

        // Internal notes
        internalNotes: [{
            content: { type: String, required: true },
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
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Compound unique index
unitSchema.index({ property: 1, unitNumber: 1 }, { unique: true });

/**
 * Property Assignment Schema
 * Links properties to owners with ownership percentages
 */
const propertyAssignmentSchema = new mongoose.Schema(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
            index: true,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Owner',
            required: true,
            index: true,
        },

        // Ownership percentage (for split ownership)
        ownershipPercent: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            default: 100,
        },

        // Assignment dates
        startDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        endDate: Date,

        // Status
        status: {
            type: String,
            enum: ['active', 'ended', 'pending'],
            default: 'pending',
            index: true,
        },

        // Whether this is the primary owner (for display/contact)
        isPrimary: {
            type: Boolean,
            default: false,
        },

        // Management fee override for this specific assignment
        managementFeeOverride: Number,

        // Notes
        notes: String,

        // Metadata
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for active assignments
propertyAssignmentSchema.index({ property: 1, status: 1 });
propertyAssignmentSchema.index({ owner: 1, status: 1 });

/**
 * Get the Property model
 */
export function getPropertyModel() {
    return mongoose.models.Property || mongoose.model('Property', propertySchema);
}

/**
 * Get the Unit model
 */
export function getUnitModel() {
    return mongoose.models.Unit || mongoose.model('Unit', unitSchema);
}

/**
 * Get the PropertyAssignment model
 */
export function getPropertyAssignmentModel() {
    return mongoose.models.PropertyAssignment || mongoose.model('PropertyAssignment', propertyAssignmentSchema);
}

export default {
    getPropertyModel,
    getUnitModel,
    getPropertyAssignmentModel,
};
