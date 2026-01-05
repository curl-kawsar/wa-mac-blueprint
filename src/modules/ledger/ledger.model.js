import mongoose from 'mongoose';

/**
 * Ledger Entry Schema
 * IMMUTABLE financial ledger entries
 * 
 * CRITICAL: Ledger entries are append-only
 * - No updates allowed
 * - No deletes allowed
 * - Corrections must be made via reversal entries
 */
const ledgerEntrySchema = new mongoose.Schema(
    {
        // Entry identifier (auto-generated, sequential)
        entryNumber: {
            type: String,
            unique: true,
            index: true,
        },

        // Account type - determines where money goes
        accountType: {
            type: String,
            required: true,
            enum: [
                'trust_rent',       // Rent held in trust for owner
                'trust_deposit',    // Security deposits held in trust
                'company_revenue',  // Management company revenue (fees)
                'expenses',         // Property expenses
            ],
            index: true,
        },

        // Transaction type - what kind of transaction
        transactionType: {
            type: String,
            required: true,
            enum: [
                // Inflows
                'rent_payment',
                'security_deposit',
                'pet_deposit',
                'late_fee',
                'application_fee',
                'utility_payment',
                'other_income',

                // Outflows
                'owner_payout',
                'deposit_refund',
                'expense',
                'management_fee',
                'maintenance_expense',
                'utility_expense',
                'tax_payment',
                'insurance_payment',
                'hoa_payment',
                'other_expense',

                // Adjustments
                'reversal',
                'adjustment',
                'transfer',
            ],
            index: true,
        },

        // Amount (positive for credits, negative for debits)
        amount: {
            type: Number,
            required: true,
        },

        // For double-entry tracking
        debitCredit: {
            type: String,
            enum: ['debit', 'credit'],
            required: true,
        },

        // Related entities
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            index: true,
        },

        unit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unit',
            index: true,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Owner',
            index: true,
        },

        tenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            index: true,
        },

        lease: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lease',
            index: true,
        },

        // Reference to source document
        sourceDocument: {
            type: {
                type: String,
                enum: ['invoice', 'payout', 'statement', 'maintenance', 'manual'],
            },
            id: mongoose.Schema.Types.ObjectId,
            number: String, // Invoice number, payout ID, etc.
        },

        // For reversals, reference to original entry
        reversalOf: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LedgerEntry',
        },

        // Indicates if this entry has been reversed
        reversedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LedgerEntry',
        },

        // Payment details (for payments)
        paymentDetails: {
            method: {
                type: String,
                enum: ['cash', 'check', 'ach', 'credit_card', 'money_order', 'wire', 'other'],
            },
            referenceNumber: String,
            checkNumber: String,
            lastFour: String, // Last 4 of card/account
        },

        // Description
        description: {
            type: String,
            required: true,
            maxlength: 500,
        },

        // Additional notes
        notes: {
            type: String,
            maxlength: 1000,
        },

        // Period this entry applies to
        periodStart: Date,
        periodEnd: Date,

        // Effective date (when the transaction occurred)
        effectiveDate: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },

        // Posted date (when entry was recorded)
        postedDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        // Status
        status: {
            type: String,
            enum: ['posted', 'reversed', 'pending'],
            default: 'posted',
            index: true,
        },

        // Payout tracking
        includedInPayout: {
            payoutId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Payout',
            },
            payoutDate: Date,
        },

        // Metadata - who created this entry
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Source IP for audit
        sourceIp: String,
    },
    {
        timestamps: true,
        // CRITICAL: Disable modifications
        strict: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Pre-save hook to generate entry number and enforce immutability
ledgerEntrySchema.pre('save', async function (next) {
    // Only allow new documents
    if (!this.isNew) {
        const error = new Error('Ledger entries are immutable and cannot be modified');
        error.code = 'LEDGER_IMMUTABLE';
        return next(error);
    }

    // Generate entry number
    if (!this.entryNumber) {
        const count = await this.constructor.countDocuments();
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        this.entryNumber = `LE-${year}${month}-${String(count + 1).padStart(7, '0')}`;
    }

    next();
});

// Prevent updates
ledgerEntrySchema.pre('updateOne', function (next) {
    const error = new Error('Ledger entries are immutable and cannot be modified');
    error.code = 'LEDGER_IMMUTABLE';
    next(error);
});

ledgerEntrySchema.pre('updateMany', function (next) {
    const error = new Error('Ledger entries are immutable and cannot be modified');
    error.code = 'LEDGER_IMMUTABLE';
    next(error);
});

ledgerEntrySchema.pre('findOneAndUpdate', function (next) {
    const error = new Error('Ledger entries are immutable and cannot be modified');
    error.code = 'LEDGER_IMMUTABLE';
    next(error);
});

// Prevent deletes
ledgerEntrySchema.pre('deleteOne', function (next) {
    const error = new Error('Ledger entries are immutable and cannot be deleted');
    error.code = 'LEDGER_IMMUTABLE';
    next(error);
});

ledgerEntrySchema.pre('deleteMany', function (next) {
    const error = new Error('Ledger entries are immutable and cannot be deleted');
    error.code = 'LEDGER_IMMUTABLE';
    next(error);
});

ledgerEntrySchema.pre('findOneAndDelete', function (next) {
    const error = new Error('Ledger entries are immutable and cannot be deleted');
    error.code = 'LEDGER_IMMUTABLE';
    next(error);
});

// Indexes for common queries
ledgerEntrySchema.index({ accountType: 1, effectiveDate: -1 });
ledgerEntrySchema.index({ property: 1, effectiveDate: -1 });
ledgerEntrySchema.index({ owner: 1, effectiveDate: -1 });
ledgerEntrySchema.index({ tenant: 1, effectiveDate: -1 });
ledgerEntrySchema.index({ 'includedInPayout.payoutId': 1 });
ledgerEntrySchema.index({ createdAt: -1 });

// Compound indexes for balance calculations
ledgerEntrySchema.index({ property: 1, accountType: 1, status: 1 });
ledgerEntrySchema.index({ owner: 1, accountType: 1, status: 1 });

/**
 * Get the LedgerEntry model
 */
export function getLedgerEntryModel() {
    return mongoose.models.LedgerEntry || mongoose.model('LedgerEntry', ledgerEntrySchema);
}

export default getLedgerEntryModel;
