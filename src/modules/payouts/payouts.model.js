import mongoose from 'mongoose';

/**
 * Owner Statement Schema
 * IMMUTABLE snapshot of owner financials for a period
 * 
 * CRITICAL: Statements are snapshots and never recalculated
 * - Once generated, statements cannot be modified
 * - They store calculated totals at the time of generation
 * - They reference specific ledger entry IDs
 */
const ownerStatementSchema = new mongoose.Schema(
    {
        // Statement identifier
        statementNumber: {
            type: String,
            unique: true,
            index: true,
        },

        // Owner
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Owner',
            required: true,
            index: true,
        },

        // Statement period
        periodStart: {
            type: Date,
            required: true,
        },

        periodEnd: {
            type: Date,
            required: true,
        },

        // Properties included in this statement
        properties: [{
            property: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Property',
            },
            propertyName: String,
            propertyAddress: String,
            ownershipPercent: Number,
        }],

        // Income summary (SNAPSHOT - not recalculated)
        income: {
            rentCollected: { type: Number, default: 0 },
            lateFees: { type: Number, default: 0 },
            otherIncome: { type: Number, default: 0 },
            totalIncome: { type: Number, default: 0 },
        },

        // Expense summary (SNAPSHOT)
        expenses: {
            managementFees: { type: Number, default: 0 },
            maintenanceExpenses: { type: Number, default: 0 },
            utilities: { type: Number, default: 0 },
            insurance: { type: Number, default: 0 },
            taxes: { type: Number, default: 0 },
            hoaFees: { type: Number, default: 0 },
            otherExpenses: { type: Number, default: 0 },
            totalExpenses: { type: Number, default: 0 },
        },

        // Net amounts
        netIncome: {
            type: Number,
            required: true,
        },

        // Ownership split (for multi-owner properties)
        ownershipSplit: {
            totalNetBeforeSplit: Number,
            ownershipPercent: Number,
            ownerShare: Number,
        },

        // Previous statement reference
        previousBalance: {
            type: Number,
            default: 0,
        },

        // Amount due to owner
        amountDue: {
            type: Number,
            required: true,
        },

        // Ledger entry IDs included in this statement
        // These are IMMUTABLE references
        ledgerEntryIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LedgerEntry',
        }],

        // Line items detail
        lineItems: [{
            date: Date,
            description: String,
            property: String,
            unit: String,
            category: {
                type: String,
                enum: ['income', 'expense', 'fee', 'adjustment'],
            },
            amount: Number,
            ledgerEntryId: mongoose.Schema.Types.ObjectId,
        }],

        // Status
        status: {
            type: String,
            enum: ['draft', 'final', 'paid'],
            default: 'draft',
        },

        // Associated payout
        payout: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payout',
        },

        // PDF/Document reference
        document: {
            documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
            generatedAt: Date,
        },

        // When statement was finalized
        finalizedAt: Date,
        finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

        // Delivery tracking
        delivery: {
            email: {
                sent: Boolean,
                sentAt: Date,
                to: String,
            },
            mail: {
                sent: Boolean,
                sentAt: Date,
            },
        },

        // Notes
        notes: String,

        // Metadata
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Generate statement number
ownerStatementSchema.pre('save', async function (next) {
    if (!this.statementNumber && this.isNew) {
        const count = await this.constructor.countDocuments();
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        this.statementNumber = `STMT-${year}${month}-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Indexes
ownerStatementSchema.index({ owner: 1, periodEnd: -1 });
ownerStatementSchema.index({ status: 1, periodEnd: -1 });

/**
 * Payout Schema
 * Represents a payout to an owner
 */
const payoutSchema = new mongoose.Schema(
    {
        // Payout identifier
        payoutNumber: {
            type: String,
            unique: true,
            index: true,
        },

        // Owner receiving payout
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Owner',
            required: true,
            index: true,
        },

        // Statement this payout is for
        statement: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'OwnerStatement',
            required: true,
        },

        // Payout amount
        amount: {
            type: Number,
            required: true,
        },

        // Payout method
        paymentMethod: {
            type: String,
            enum: ['ach', 'check', 'wire'],
            required: true,
        },

        // Bank info snapshot (for reference, not the actual encrypted data)
        bankInfoSnapshot: {
            bankName: String,
            accountLast4: String,
            accountType: String,
        },

        // Check info (if applicable)
        checkInfo: {
            checkNumber: String,
            mailedDate: Date,
            mailedTo: String,
        },

        // ACH/Wire info
        transferInfo: {
            referenceNumber: String,
            initiatedAt: Date,
            completedAt: Date,
        },

        // Status
        status: {
            type: String,
            enum: [
                'pending',
                'approved',
                'processing',
                'completed',
                'failed',
                'cancelled',
            ],
            default: 'pending',
            index: true,
        },

        // Approval workflow
        approval: {
            required: { type: Boolean, default: true },
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            approvedAt: Date,
            rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rejectedAt: Date,
            rejectionReason: String,
        },

        // Processing dates
        scheduledDate: Date,
        processedDate: Date,
        completedDate: Date,

        // Ledger entry for this payout
        ledgerEntryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LedgerEntry',
        },

        // Failure info
        failure: {
            reason: String,
            code: String,
            failedAt: Date,
            retryCount: { type: Number, default: 0 },
        },

        // Notes
        notes: String,
        internalNotes: String,

        // Metadata
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
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

// Generate payout number
payoutSchema.pre('save', async function (next) {
    if (!this.payoutNumber && this.isNew) {
        const count = await this.constructor.countDocuments();
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        this.payoutNumber = `PAY-${year}${month}-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Indexes
payoutSchema.index({ owner: 1, status: 1 });
payoutSchema.index({ status: 1, scheduledDate: 1 });

/**
 * Payout Run Schema
 * Represents a batch payout run
 */
const payoutRunSchema = new mongoose.Schema(
    {
        // Run identifier
        runNumber: {
            type: String,
            unique: true,
            index: true,
        },

        // Period for this run
        periodStart: {
            type: Date,
            required: true,
        },

        periodEnd: {
            type: Date,
            required: true,
        },

        // Status
        status: {
            type: String,
            enum: ['draft', 'processing', 'completed', 'failed', 'cancelled'],
            default: 'draft',
        },

        // Summary
        summary: {
            totalOwners: { type: Number, default: 0 },
            totalStatements: { type: Number, default: 0 },
            totalPayouts: { type: Number, default: 0 },
            totalAmount: { type: Number, default: 0 },
            successfulPayouts: { type: Number, default: 0 },
            failedPayouts: { type: Number, default: 0 },
        },

        // Individual payouts in this run
        payouts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payout',
        }],

        // Statements generated in this run
        statements: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'OwnerStatement',
        }],

        // Processing timestamps
        startedAt: Date,
        completedAt: Date,

        // Errors during run
        errors: [{
            ownerId: mongoose.Schema.Types.ObjectId,
            error: String,
            timestamp: Date,
        }],

        // Notes
        notes: String,

        // Metadata
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Generate run number
payoutRunSchema.pre('save', async function (next) {
    if (!this.runNumber && this.isNew) {
        const count = await this.constructor.countDocuments();
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        this.runNumber = `RUN-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

/**
 * Get models
 */
export function getOwnerStatementModel() {
    return mongoose.models.OwnerStatement || mongoose.model('OwnerStatement', ownerStatementSchema);
}

export function getPayoutModel() {
    return mongoose.models.Payout || mongoose.model('Payout', payoutSchema);
}

export function getPayoutRunModel() {
    return mongoose.models.PayoutRun || mongoose.model('PayoutRun', payoutRunSchema);
}

export default {
    getOwnerStatementModel,
    getPayoutModel,
    getPayoutRunModel,
};
