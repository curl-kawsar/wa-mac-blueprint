import mongoose from 'mongoose';

/**
 * Owner Schema
 * Represents property owners in the system
 */
const ownerSchema = new mongoose.Schema(
    {
        // Basic Information
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: 50,
        },

        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            maxlength: 50,
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        phone: {
            type: String,
            trim: true,
        },

        alternatePhone: {
            type: String,
            trim: true,
        },

        // Address
        address: {
            street: { type: String, trim: true },
            unit: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            zipCode: { type: String, trim: true },
            country: { type: String, default: 'USA' },
        },

        // Tax Information (Encrypted)
        taxInfo: {
            // SSN - encrypted, stored as iv:tag:ciphertext
            ssnEncrypted: {
                type: String,
                select: false, // Never return by default
            },
            // Last 4 digits for display
            ssnLast4: {
                type: String,
            },
            // Tax ID type
            taxIdType: {
                type: String,
                enum: ['ssn', 'ein', 'itin'],
                default: 'ssn',
            },
            // EIN for business owners
            einEncrypted: {
                type: String,
                select: false,
            },
            einLast4: {
                type: String,
            },
        },

        // Bank Information (Encrypted)
        bankInfo: {
            // Encrypted bank details (routing, account number)
            encrypted: {
                type: String,
                select: false, // Never return by default
            },
            // Last 4 of account for display
            accountLast4: {
                type: String,
            },
            // Account type (for display only)
            accountType: {
                type: String,
                enum: ['checking', 'savings'],
                default: 'checking',
            },
            // Bank name for display
            bankName: {
                type: String,
                trim: true,
            },
            // Payment method preference
            paymentMethod: {
                type: String,
                enum: ['ach', 'check', 'wire'],
                default: 'ach',
            },
        },

        // W9 Information
        w9: {
            // W9 document reference
            documentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Document',
            },
            // Date W9 was received
            receivedDate: Date,
            // Year for which W9 is valid
            taxYear: Number,
            // Business name if applicable
            businessName: String,
            // Business type
            businessType: {
                type: String,
                enum: [
                    'individual',
                    'sole_proprietor',
                    'llc_single',
                    'llc_multi',
                    'c_corp',
                    's_corp',
                    'partnership',
                    'trust',
                ],
            },
        },

        // Owner status
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending', 'suspended'],
            default: 'pending',
            index: true,
        },

        // Contract/Agreement
        contract: {
            // Management agreement document
            documentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Document',
            },
            // Contract dates
            startDate: Date,
            endDate: Date,
            // Management fee percentage
            managementFeePercent: {
                type: Number,
                min: 0,
                max: 100,
                default: 10,
            },
            // Signed status
            signedAt: Date,
            signedIp: String,
        },

        // Communication preferences
        preferences: {
            emailNotifications: { type: Boolean, default: true },
            smsNotifications: { type: Boolean, default: false },
            statementFrequency: {
                type: String,
                enum: ['monthly', 'quarterly', 'annually'],
                default: 'monthly',
            },
            preferredContactMethod: {
                type: String,
                enum: ['email', 'phone', 'sms'],
                default: 'email',
            },
        },

        // Linked user account
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            unique: true,
            sparse: true,
            index: true,
        },

        // Notes (admin only)
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
        toJSON: {
            virtuals: true,
            transform: (doc, ret) => {
                // Never expose encrypted fields
                delete ret.taxInfo?.ssnEncrypted;
                delete ret.taxInfo?.einEncrypted;
                delete ret.bankInfo?.encrypted;
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
        },
    }
);

// Virtual for full name
ownerSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name (with business)
ownerSchema.virtual('displayName').get(function () {
    if (this.w9?.businessName) {
        return `${this.w9.businessName} (${this.fullName})`;
    }
    return this.fullName;
});

// Compound indexes
ownerSchema.index({ firstName: 1, lastName: 1 });
ownerSchema.index({ 'contract.endDate': 1, status: 1 });

/**
 * Get the Owner model
 */
export function getOwnerModel() {
    return mongoose.models.Owner || mongoose.model('Owner', ownerSchema);
}

export default getOwnerModel;
