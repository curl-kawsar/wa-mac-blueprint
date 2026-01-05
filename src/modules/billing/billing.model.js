import mongoose from 'mongoose';

/**
 * Invoice Schema
 * Represents a billing invoice
 */
const invoiceSchema = new mongoose.Schema(
    {
        // Invoice number (auto-generated)
        invoiceNumber: {
            type: String,
            unique: true,
            index: true,
        },

        // Related entities
        tenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
            index: true,
        },

        lease: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lease',
            required: true,
            index: true,
        },

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

        // Invoice type
        type: {
            type: String,
            enum: [
                'rent',
                'security_deposit',
                'pet_deposit',
                'pet_rent',
                'late_fee',
                'utility',
                'maintenance',
                'move_in',
                'move_out',
                'other',
            ],
            required: true,
            index: true,
        },

        // Billing period
        periodStart: Date,
        periodEnd: Date,

        // Line items
        lineItems: [{
            description: { type: String, required: true },
            quantity: { type: Number, default: 1 },
            unitPrice: { type: Number, required: true },
            amount: { type: Number, required: true },
            category: {
                type: String,
                enum: ['rent', 'deposit', 'fee', 'utility', 'maintenance', 'other'],
            },
        }],

        // Totals
        subtotal: {
            type: Number,
            required: true,
        },

        tax: {
            type: Number,
            default: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
        },

        // Payment tracking
        amountPaid: {
            type: Number,
            default: 0,
        },

        balance: {
            type: Number,
            required: true,
        },

        // Dates
        issueDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        dueDate: {
            type: Date,
            required: true,
            index: true,
        },

        // Status
        status: {
            type: String,
            enum: ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded'],
            default: 'draft',
            index: true,
        },

        // Payments received
        payments: [{
            amount: Number,
            paymentDate: Date,
            paymentMethod: {
                type: String,
                enum: ['cash', 'check', 'ach', 'credit_card', 'money_order', 'other'],
            },
            referenceNumber: String,
            ledgerEntryId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'LedgerEntry',
            },
            receivedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            notes: String,
        }],

        // Late fee tracking
        lateFee: {
            applied: { type: Boolean, default: false },
            appliedDate: Date,
            amount: Number,
            waived: { type: Boolean, default: false },
            waivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            waivedReason: String,
        },

        // Reminders sent
        remindersSent: [{
            type: { type: String, enum: ['upcoming', 'due', 'overdue'] },
            sentAt: Date,
            method: { type: String, enum: ['email', 'sms'] },
        }],

        // Notes
        notes: String,
        internalNotes: String,

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

// Pre-save hook to generate invoice number
invoiceSchema.pre('save', async function (next) {
    if (!this.invoiceNumber) {
        const count = await this.constructor.countDocuments();
        const year = new Date().getFullYear();
        this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Virtual for isPaid
invoiceSchema.virtual('isPaid').get(function () {
    return this.status === 'paid';
});

// Virtual for isOverdue
invoiceSchema.virtual('isOverdue').get(function () {
    return this.status === 'overdue' ||
        (this.balance > 0 && new Date() > this.dueDate);
});

// Indexes
invoiceSchema.index({ dueDate: 1, status: 1 });
invoiceSchema.index({ tenant: 1, status: 1, dueDate: -1 });

/**
 * Invoice Schedule Schema
 * For recurring invoice generation
 */
const invoiceScheduleSchema = new mongoose.Schema(
    {
        lease: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lease',
            required: true,
            index: true,
        },

        // Schedule type
        type: {
            type: String,
            enum: ['rent', 'pet_rent', 'utility', 'other'],
            required: true,
        },

        // Frequency
        frequency: {
            type: String,
            enum: ['monthly', 'quarterly', 'annually', 'one_time'],
            default: 'monthly',
        },

        // Schedule details
        dayOfMonth: {
            type: Number,
            min: 1,
            max: 31,
            default: 1,
        },

        amount: {
            type: Number,
            required: true,
        },

        description: String,

        // Active period
        startDate: {
            type: Date,
            required: true,
        },

        endDate: Date,

        // Status
        status: {
            type: String,
            enum: ['active', 'paused', 'completed', 'cancelled'],
            default: 'active',
        },

        // Last generated
        lastGeneratedDate: Date,
        nextGenerationDate: Date,

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

// Index for finding schedules to process
invoiceScheduleSchema.index({ status: 1, nextGenerationDate: 1 });

/**
 * Get the Invoice model
 */
export function getInvoiceModel() {
    return mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
}

/**
 * Get the InvoiceSchedule model
 */
export function getInvoiceScheduleModel() {
    return mongoose.models.InvoiceSchedule || mongoose.model('InvoiceSchedule', invoiceScheduleSchema);
}

export default {
    getInvoiceModel,
    getInvoiceScheduleModel,
};
