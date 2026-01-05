import mongoose from 'mongoose';

/**
 * Lease Schema
 * Represents a rental lease agreement
 */
const leaseSchema = new mongoose.Schema(
    {
        // Parties
        tenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
            index: true,
        },

        // Property/Unit
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
            index: true,
        },

        unit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unit',
            required: true,
            index: true,
        },

        // Lease term
        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            required: true,
        },

        // Lease type
        leaseType: {
            type: String,
            enum: ['fixed', 'month_to_month'],
            default: 'fixed',
        },

        // Status
        status: {
            type: String,
            enum: [
                'draft',
                'pending_signature',
                'active',
                'expired',
                'terminated',
                'renewed',
            ],
            default: 'draft',
            index: true,
        },

        // Rent details
        rent: {
            monthlyAmount: {
                type: Number,
                required: true,
            },
            // Due day of month (1-31)
            dueDay: {
                type: Number,
                default: 1,
                min: 1,
                max: 31,
            },
            // Grace period in days
            gracePeriod: {
                type: Number,
                default: 5,
            },
            // Late fee
            lateFeeType: {
                type: String,
                enum: ['flat', 'percentage', 'daily'],
                default: 'flat',
            },
            lateFeeAmount: {
                type: Number,
                default: 50,
            },
            // Maximum late fee (for daily fees)
            maxLateFee: Number,
        },

        // Security deposit
        securityDeposit: {
            amount: Number,
            receivedDate: Date,
            ledgerEntryId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'LedgerEntry',
            },
            // Deposit disposition at move-out
            disposition: {
                status: {
                    type: String,
                    enum: ['held', 'partially_refunded', 'fully_refunded', 'forfeited'],
                },
                deductions: [{
                    reason: String,
                    amount: Number,
                }],
                refundAmount: Number,
                refundDate: Date,
            },
        },

        // Pet deposit/rent
        petDeposit: Number,
        petRent: Number,

        // Proration (for partial first/last month)
        proration: {
            firstMonth: {
                isProrated: { type: Boolean, default: false },
                days: Number,
                amount: Number,
            },
            lastMonth: {
                isProrated: { type: Boolean, default: false },
                days: Number,
                amount: Number,
            },
        },

        // Move-in costs
        moveInCosts: [{
            description: String,
            amount: Number,
            paid: { type: Boolean, default: false },
            paidDate: Date,
        }],

        // Occupants on lease
        occupants: [{
            firstName: String,
            lastName: String,
            relationship: String,
            dateOfBirth: Date,
        }],

        // Lease documents
        documents: [{
            documentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Document',
            },
            type: {
                type: String,
                enum: ['lease_agreement', 'addendum', 'amendment', 'move_in_checklist', 'other'],
            },
            name: String,
            uploadedAt: Date,
        }],

        // Signatures
        signatures: {
            tenant: {
                signedAt: Date,
                signedIp: String,
                signatureData: String, // base64 or reference
            },
            manager: {
                signedAt: Date,
                signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            },
        },

        // Renewal info
        renewal: {
            previousLeaseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Lease',
            },
            renewedToLeaseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Lease',
            },
            renewalOffered: Date,
            renewalOfferExpires: Date,
            renewalDeclined: Boolean,
            declineReason: String,
        },

        // Termination info
        termination: {
            type: {
                type: String,
                enum: ['natural', 'early_tenant', 'early_landlord', 'eviction', 'mutual'],
            },
            noticeDate: Date,
            effectiveDate: Date,
            reason: String,
            earlyTerminationFee: Number,
        },

        // Special terms/clauses
        specialTerms: [String],

        // Notes
        internalNotes: [{
            content: String,
            createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            createdAt: { type: Date, default: Date.now },
        }],

        // Original application
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TenantApplication',
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

// Virtuals
leaseSchema.virtual('termInMonths').get(function () {
    if (!this.startDate || !this.endDate) return 0;
    const months = (this.endDate.getFullYear() - this.startDate.getFullYear()) * 12 +
        (this.endDate.getMonth() - this.startDate.getMonth());
    return months;
});

leaseSchema.virtual('isActive').get(function () {
    return this.status === 'active';
});

leaseSchema.virtual('isExpiringSoon').get(function () {
    if (this.status !== 'active') return false;
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return this.endDate <= thirtyDaysFromNow;
});

// Indexes
leaseSchema.index({ tenant: 1, status: 1 });
leaseSchema.index({ unit: 1, status: 1 });
leaseSchema.index({ endDate: 1, status: 1 });
leaseSchema.index({ 'rent.dueDay': 1, status: 1 });

/**
 * Get the Lease model
 */
export function getLeaseModel() {
    return mongoose.models.Lease || mongoose.model('Lease', leaseSchema);
}

export default getLeaseModel;
