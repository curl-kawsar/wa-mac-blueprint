import mongoose from 'mongoose';

/**
 * Maintenance Request Schema
 */
const maintenanceRequestSchema = new mongoose.Schema(
    {
        // Request identifier
        requestNumber: {
            type: String,
            unique: true,
            index: true,
        },

        // Related entities
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
            index: true,
        },

        unit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unit',
            index: true,
        },

        tenant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tenant',
            index: true,
        },

        // Request details
        title: {
            type: String,
            required: true,
            maxlength: 200,
        },

        description: {
            type: String,
            required: true,
            maxlength: 5000,
        },

        category: {
            type: String,
            enum: [
                'plumbing',
                'electrical',
                'hvac',
                'appliance',
                'structural',
                'pest_control',
                'landscaping',
                'cleaning',
                'security',
                'general',
                'other',
            ],
            required: true,
            index: true,
        },

        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'emergency'],
            default: 'medium',
            index: true,
        },

        // Status
        status: {
            type: String,
            enum: [
                'submitted',
                'pending_approval',
                'approved',
                'assigned',
                'in_progress',
                'pending_parts',
                'completed',
                'cancelled',
                'on_hold',
            ],
            default: 'submitted',
            index: true,
        },

        // Assignment
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },

        assignedAt: Date,

        // Scheduling
        scheduledDate: Date,
        scheduledTimeSlot: {
            start: String, // e.g., "09:00"
            end: String,   // e.g., "12:00"
        },

        // Entry permission
        entryPermission: {
            granted: { type: Boolean, default: false },
            notes: String,
        },

        // Photos
        photos: [{
            url: String,
            caption: String,
            uploadedAt: { type: Date, default: Date.now },
            uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        }],

        // Approval workflow
        approval: {
            required: { type: Boolean, default: true },
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            approvedAt: Date,
            estimatedCost: Number,
            approvalNotes: String,
        },

        // Work performed
        workLog: [{
            date: { type: Date, default: Date.now },
            description: String,
            hoursWorked: Number,
            worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            materials: [{
                item: String,
                quantity: Number,
                cost: Number,
            }],
        }],

        // Completion
        completion: {
            completedAt: Date,
            completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            resolutionNotes: String,
            tenantSatisfaction: {
                rating: { type: Number, min: 1, max: 5 },
                feedback: String,
                submittedAt: Date,
            },
        },

        // Costs
        costs: {
            labor: { type: Number, default: 0 },
            materials: { type: Number, default: 0 },
            vendor: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },

        // Expense linkage to ledger
        ledgerEntryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LedgerEntry',
        },

        // Vendor info (if outsourced)
        vendor: {
            name: String,
            phone: String,
            email: String,
            invoiceNumber: String,
        },

        // Notes
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
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Generate request number
maintenanceRequestSchema.pre('save', async function (next) {
    if (!this.requestNumber && this.isNew) {
        const count = await this.constructor.countDocuments();
        const year = new Date().getFullYear();
        this.requestNumber = `MR-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Indexes
maintenanceRequestSchema.index({ status: 1, priority: -1, createdAt: -1 });
maintenanceRequestSchema.index({ assignedTo: 1, status: 1 });

/**
 * Get the MaintenanceRequest model
 */
export function getMaintenanceRequestModel() {
    return mongoose.models.MaintenanceRequest || mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
}

export default getMaintenanceRequestModel;
