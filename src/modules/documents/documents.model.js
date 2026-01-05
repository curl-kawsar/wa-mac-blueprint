import mongoose from 'mongoose';

/**
 * Document Metadata Schema
 * Stores metadata about documents with visibility rules
 */
const documentSchema = new mongoose.Schema(
    {
        // Document name
        name: {
            type: String,
            required: true,
            maxlength: 255,
        },

        // Original filename
        originalFilename: {
            type: String,
            required: true,
        },

        // MIME type
        mimeType: {
            type: String,
            required: true,
        },

        // File size in bytes
        size: {
            type: Number,
            required: true,
        },

        // Document category
        category: {
            type: String,
            enum: [
                'lease',
                'application',
                'id',
                'income_verification',
                'w9',
                'insurance',
                'inspection',
                'maintenance',
                'invoice',
                'receipt',
                'statement',
                'notice',
                'correspondence',
                'photo',
                'other',
            ],
            default: 'other',
            index: true,
        },

        // Storage info
        storage: {
            adapter: {
                type: String,
                enum: ['local', 's3', 'gcs'],
                required: true,
            },
            path: {
                type: String,
                required: true,
            },
            bucket: String, // For cloud storage
            key: String,    // For cloud storage
        },

        // Related entities (at least one should be set)
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

        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            index: true,
        },

        unit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unit',
        },

        lease: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lease',
            index: true,
        },

        maintenanceRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MaintenanceRequest',
        },

        // Visibility rules
        visibility: {
            // Who can view this document
            allowedRoles: [{
                type: String,
                enum: [
                    'super_admin',
                    'admin',
                    'property_manager',
                    'leasing_agent',
                    'maintenance_staff',
                    'accountant',
                    'owner',
                    'tenant',
                ],
            }],
            // Specific users who can view
            allowedUsers: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }],
            // Is this document public to the related party?
            isPublicToOwner: { type: Boolean, default: false },
            isPublicToTenant: { type: Boolean, default: false },
        },

        // Document status
        status: {
            type: String,
            enum: ['active', 'archived', 'deleted'],
            default: 'active',
            index: true,
        },

        // Expiration (for documents that expire)
        expiresAt: Date,

        // Version control
        version: {
            type: Number,
            default: 1,
        },

        previousVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
        },

        // Metadata
        description: String,
        tags: [String],

        // Upload info
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Access log (last 10 accesses)
        accessLog: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            accessedAt: Date,
            action: { type: String, enum: ['view', 'download'] },
        }],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for file extension
documentSchema.virtual('extension').get(function () {
    const parts = this.originalFilename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
});

// Virtual for human-readable size
documentSchema.virtual('humanSize').get(function () {
    const bytes = this.size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
});

// Indexes
documentSchema.index({ category: 1, status: 1, createdAt: -1 });
documentSchema.index({ 'visibility.allowedRoles': 1 });

/**
 * Get the Document model
 */
export function getDocumentModel() {
    return mongoose.models.Document || mongoose.model('Document', documentSchema);
}

export default getDocumentModel;
