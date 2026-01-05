import mongoose from 'mongoose';

/**
 * Ticket Schema
 * Thread-based communication system
 */
const ticketSchema = new mongoose.Schema(
    {
        // Ticket identifier
        ticketNumber: {
            type: String,
            unique: true,
            index: true,
        },

        // Subject
        subject: {
            type: String,
            required: true,
            maxlength: 200,
        },

        // Category
        category: {
            type: String,
            enum: [
                'general_inquiry',
                'billing',
                'maintenance',
                'lease',
                'complaint',
                'suggestion',
                'emergency',
                'other',
            ],
            default: 'general_inquiry',
        },

        // Priority
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },

        // Status
        status: {
            type: String,
            enum: ['open', 'in_progress', 'waiting_response', 'resolved', 'closed'],
            default: 'open',
            index: true,
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
        },

        // Participants
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        // Messages (thread)
        messages: [{
            content: {
                type: String,
                required: true,
                maxlength: 10000,
            },
            author: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            authorRole: String,
            attachments: [{
                documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
                name: String,
                type: String,
            }],
            isInternal: { type: Boolean, default: false }, // Internal notes not visible to tenant/owner
            createdAt: { type: Date, default: Date.now },
        }],

        // Resolution
        resolution: {
            resolvedAt: Date,
            resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            resolutionNotes: String,
        },

        // Last activity
        lastActivityAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        // Tags
        tags: [String],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Generate ticket number
ticketSchema.pre('save', async function (next) {
    if (!this.ticketNumber && this.isNew) {
        const count = await this.constructor.countDocuments();
        const year = new Date().getFullYear();
        this.ticketNumber = `TKT-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Update last activity when message added
ticketSchema.methods.addMessage = async function (message) {
    this.messages.push(message);
    this.lastActivityAt = new Date();
    if (this.status === 'resolved' || this.status === 'closed') {
        this.status = 'open';
    }
    await this.save();
    return this;
};

/**
 * Announcement Schema
 * Broadcast announcements with expiry
 */
const announcementSchema = new mongoose.Schema(
    {
        // Title
        title: {
            type: String,
            required: true,
            maxlength: 200,
        },

        // Content
        content: {
            type: String,
            required: true,
            maxlength: 10000,
        },

        // Type
        type: {
            type: String,
            enum: ['info', 'warning', 'urgent', 'maintenance', 'event'],
            default: 'info',
        },

        // Target audience
        audience: {
            type: {
                type: String,
                enum: ['all', 'tenants', 'owners', 'staff', 'property'],
                default: 'all',
            },
            // Specific properties (if type is 'property')
            properties: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Property',
            }],
        },

        // Visibility dates
        publishAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        expiresAt: {
            type: Date,
            index: true,
        },

        // Status
        status: {
            type: String,
            enum: ['draft', 'published', 'expired', 'cancelled'],
            default: 'draft',
            index: true,
        },

        // Attachments
        attachments: [{
            documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
            name: String,
        }],

        // Read tracking
        readBy: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            readAt: Date,
        }],

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

// Virtual for active status
announcementSchema.virtual('isActive').get(function () {
    const now = new Date();
    return (
        this.status === 'published' &&
        this.publishAt <= now &&
        (!this.expiresAt || this.expiresAt > now)
    );
});

/**
 * Get models
 */
export function getTicketModel() {
    return mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
}

export function getAnnouncementModel() {
    return mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
}

export default {
    getTicketModel,
    getAnnouncementModel,
};
