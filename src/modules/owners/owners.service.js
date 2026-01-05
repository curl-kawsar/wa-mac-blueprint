import { connectDB } from '@/lib/db/mongoose';
import { getOwnerModel } from './owners.model';
import { encryptSSN, decryptSSN, encryptBankInfo, decryptBankInfo } from '@/lib/crypto/encryption';
import { auditActions, logAction } from '@/lib/audit/audit.service';

/**
 * Owners Service
 * Handles all owner-related business logic
 */

/**
 * Create a new owner
 * 
 * @param {object} ownerData - Owner data
 * @param {object} actor - User creating the owner
 * @param {object} context - Request context
 * @returns {Promise<object>} Created owner
 */
export async function createOwner(ownerData, actor, context = {}) {
    await connectDB();
    const Owner = getOwnerModel();

    // Check if email already exists
    const existingOwner = await Owner.findOne({ email: ownerData.email });
    if (existingOwner) {
        throw new Error('An owner with this email already exists');
    }

    // Prepare owner document
    const ownerDoc = {
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
        email: ownerData.email,
        phone: ownerData.phone,
        alternatePhone: ownerData.alternatePhone,
        address: ownerData.address,
        status: ownerData.status || 'pending',
        preferences: ownerData.preferences,
        createdBy: actor.id,
    };

    // Handle SSN encryption
    if (ownerData.ssn) {
        const { encrypted, last4 } = encryptSSN(ownerData.ssn);
        ownerDoc.taxInfo = {
            ...ownerDoc.taxInfo,
            taxIdType: ownerData.taxIdType || 'ssn',
            ssnEncrypted: encrypted,
            ssnLast4: last4,
        };
    }

    // Handle EIN encryption
    if (ownerData.ein) {
        const { encrypted, last4 } = encryptSSN(ownerData.ein); // Same encryption for EIN
        ownerDoc.taxInfo = {
            ...ownerDoc.taxInfo,
            taxIdType: 'ein',
            einEncrypted: encrypted,
            einLast4: last4,
        };
    }

    // Handle bank info encryption
    if (ownerData.bankInfo) {
        const { encrypted, last4, accountType } = encryptBankInfo(ownerData.bankInfo);
        ownerDoc.bankInfo = {
            encrypted,
            accountLast4: last4,
            accountType,
            bankName: ownerData.bankInfo.bankName,
            paymentMethod: ownerData.bankInfo.paymentMethod || 'ach',
        };
    }

    // Contract info
    if (ownerData.managementFeePercent !== undefined) {
        ownerDoc.contract = {
            managementFeePercent: ownerData.managementFeePercent,
            startDate: ownerData.contractStartDate ? new Date(ownerData.contractStartDate) : undefined,
            endDate: ownerData.contractEndDate ? new Date(ownerData.contractEndDate) : undefined,
        };
    }

    // W9 info
    if (ownerData.w9) {
        ownerDoc.w9 = {
            receivedDate: ownerData.w9.receivedDate ? new Date(ownerData.w9.receivedDate) : undefined,
            taxYear: ownerData.w9.taxYear,
            businessName: ownerData.w9.businessName,
            businessType: ownerData.w9.businessType,
        };
    }

    const owner = new Owner(ownerDoc);
    await owner.save();

    // Audit log
    await logAction(
        'owner.created',
        actor,
        { type: 'owner', id: owner._id, name: owner.fullName },
        { after: { email: owner.email, status: owner.status } },
        context
    );

    return owner.toJSON();
}

/**
 * Get owner by ID
 * 
 * @param {string} ownerId - Owner ID
 * @param {object} options - Query options
 * @returns {Promise<object|null>} Owner object
 */
export async function getOwnerById(ownerId, options = {}) {
    await connectDB();
    const Owner = getOwnerModel();

    let query = Owner.findById(ownerId);

    // Include sensitive fields if requested (requires special permission)
    if (options.includeSensitive) {
        query = query.select('+taxInfo.ssnEncrypted +taxInfo.einEncrypted +bankInfo.encrypted');
    }

    const owner = await query.lean();
    return owner;
}

/**
 * Get owner by email
 * 
 * @param {string} email - Owner email
 * @returns {Promise<object|null>} Owner object
 */
export async function getOwnerByEmail(email) {
    await connectDB();
    const Owner = getOwnerModel();

    return Owner.findOne({ email: email.toLowerCase() }).lean();
}

/**
 * Get owner by user ID
 * 
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Owner object
 */
export async function getOwnerByUserId(userId) {
    await connectDB();
    const Owner = getOwnerModel();

    return Owner.findOne({ userId }).lean();
}

/**
 * List owners with pagination and filters
 * 
 * @param {object} filters - Query filters
 * @param {object} options - Pagination options
 * @returns {Promise<object>} Paginated owners
 */
export async function listOwners(filters = {}, options = {}) {
    await connectDB();
    const Owner = getOwnerModel();

    const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = options;

    const query = {};

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.search) {
        query.$or = [
            { email: { $regex: filters.search, $options: 'i' } },
            { firstName: { $regex: filters.search, $options: 'i' } },
            { lastName: { $regex: filters.search, $options: 'i' } },
            { 'w9.businessName': { $regex: filters.search, $options: 'i' } },
        ];
    }

    const [owners, total] = await Promise.all([
        Owner.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Owner.countDocuments(query),
    ]);

    return {
        data: owners,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}

/**
 * Update owner
 * 
 * @param {string} ownerId - Owner ID
 * @param {object} updates - Updates to apply
 * @param {object} actor - User making the update
 * @param {object} context - Request context
 * @returns {Promise<object>} Updated owner
 */
export async function updateOwner(ownerId, updates, actor, context = {}) {
    await connectDB();
    const Owner = getOwnerModel();

    const owner = await Owner.findById(ownerId);

    if (!owner) {
        throw new Error('Owner not found');
    }

    // Apply allowed updates
    const allowedFields = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'alternatePhone',
        'address',
        'preferences',
        'status',
    ];

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            owner[field] = updates[field];
        }
    }

    // Update management fee if provided
    if (updates.managementFeePercent !== undefined) {
        owner.contract = owner.contract || {};
        owner.contract.managementFeePercent = updates.managementFeePercent;
    }

    owner.updatedBy = actor.id;
    await owner.save();

    // Audit log
    await logAction(
        'owner.updated',
        actor,
        { type: 'owner', id: owner._id, name: owner.fullName },
        { after: updates },
        context
    );

    return owner.toJSON();
}

/**
 * Update owner tax information
 * 
 * @param {string} ownerId - Owner ID
 * @param {object} taxInfo - Tax information
 * @param {object} actor - User making the update
 * @param {object} context - Request context
 * @returns {Promise<object>} Updated owner
 */
export async function updateOwnerTaxInfo(ownerId, taxInfo, actor, context = {}) {
    await connectDB();
    const Owner = getOwnerModel();

    const owner = await Owner.findById(ownerId);

    if (!owner) {
        throw new Error('Owner not found');
    }

    owner.taxInfo = owner.taxInfo || {};
    owner.taxInfo.taxIdType = taxInfo.taxIdType;

    if (taxInfo.ssn) {
        const { encrypted, last4 } = encryptSSN(taxInfo.ssn);
        owner.taxInfo.ssnEncrypted = encrypted;
        owner.taxInfo.ssnLast4 = last4;
    }

    if (taxInfo.ein) {
        const { encrypted, last4 } = encryptSSN(taxInfo.ein);
        owner.taxInfo.einEncrypted = encrypted;
        owner.taxInfo.einLast4 = last4;
    }

    owner.updatedBy = actor.id;
    await owner.save();

    // Audit log - sensitive operation
    await logAction(
        'owner.tax_info_changed',
        actor,
        { type: 'owner', id: owner._id, name: owner.fullName },
        { metadata: { taxIdType: taxInfo.taxIdType } },
        context
    );

    return owner.toJSON();
}

/**
 * Update owner bank information
 * 
 * @param {string} ownerId - Owner ID
 * @param {object} bankInfo - Bank information
 * @param {object} actor - User making the update
 * @param {object} context - Request context
 * @returns {Promise<object>} Updated owner
 */
export async function updateOwnerBankInfo(ownerId, bankInfo, actor, context = {}) {
    await connectDB();
    const Owner = getOwnerModel();

    const owner = await Owner.findById(ownerId);

    if (!owner) {
        throw new Error('Owner not found');
    }

    const { encrypted, last4, accountType } = encryptBankInfo(bankInfo);

    owner.bankInfo = {
        encrypted,
        accountLast4: last4,
        accountType,
        bankName: bankInfo.bankName,
        paymentMethod: bankInfo.paymentMethod || 'ach',
    };

    owner.updatedBy = actor.id;
    await owner.save();

    // Audit log - sensitive operation
    await auditActions.ownerBankInfoChanged(actor, owner, context);

    return owner.toJSON();
}

/**
 * Get decrypted sensitive info (requires special permission)
 * 
 * @param {string} ownerId - Owner ID
 * @param {object} actor - User requesting info
 * @param {object} context - Request context
 * @returns {Promise<object>} Decrypted sensitive info
 */
export async function getOwnerSensitiveInfo(ownerId, actor, context = {}) {
    await connectDB();
    const Owner = getOwnerModel();

    const owner = await Owner.findById(ownerId)
        .select('+taxInfo.ssnEncrypted +taxInfo.einEncrypted +bankInfo.encrypted')
        .lean();

    if (!owner) {
        throw new Error('Owner not found');
    }

    const result = {
        ownerId: owner._id,
        fullName: `${owner.firstName} ${owner.lastName}`,
    };

    // Decrypt SSN if present
    if (owner.taxInfo?.ssnEncrypted) {
        result.ssn = decryptSSN(owner.taxInfo.ssnEncrypted);

        // Audit log - sensitive view
        await auditActions.ownerSSNViewed(actor, owner, context);
    }

    // Decrypt EIN if present
    if (owner.taxInfo?.einEncrypted) {
        result.ein = decryptSSN(owner.taxInfo.einEncrypted);
    }

    // Decrypt bank info if present
    if (owner.bankInfo?.encrypted) {
        result.bankInfo = decryptBankInfo(owner.bankInfo.encrypted);
    }

    return result;
}

/**
 * Add internal note to owner
 * 
 * @param {string} ownerId - Owner ID
 * @param {string} content - Note content
 * @param {object} actor - User adding the note
 * @returns {Promise<object>} Updated owner
 */
export async function addOwnerNote(ownerId, content, actor) {
    await connectDB();
    const Owner = getOwnerModel();

    const owner = await Owner.findByIdAndUpdate(
        ownerId,
        {
            $push: {
                internalNotes: {
                    content,
                    createdBy: actor.id,
                    createdAt: new Date(),
                },
            },
        },
        { new: true }
    ).lean();

    if (!owner) {
        throw new Error('Owner not found');
    }

    return owner;
}

/**
 * Link owner to user account
 * 
 * @param {string} ownerId - Owner ID
 * @param {string} userId - User ID to link
 * @param {object} actor - User performing the link
 * @returns {Promise<object>} Updated owner
 */
export async function linkOwnerToUser(ownerId, userId, actor) {
    await connectDB();
    const Owner = getOwnerModel();

    const owner = await Owner.findByIdAndUpdate(
        ownerId,
        {
            $set: {
                userId,
                updatedBy: actor.id,
            },
        },
        { new: true }
    ).lean();

    if (!owner) {
        throw new Error('Owner not found');
    }

    return owner;
}

/**
 * Delete owner (soft delete by setting status)
 * 
 * @param {string} ownerId - Owner ID
 * @param {object} actor - User performing the deletion
 * @param {object} context - Request context
 */
export async function deleteOwner(ownerId, actor, context = {}) {
    await connectDB();
    const Owner = getOwnerModel();

    const owner = await Owner.findByIdAndUpdate(
        ownerId,
        {
            $set: {
                status: 'inactive',
                updatedBy: actor.id,
            },
        },
        { new: true }
    ).lean();

    if (!owner) {
        throw new Error('Owner not found');
    }

    // Audit log
    await logAction(
        'owner.deleted',
        actor,
        { type: 'owner', id: owner._id, name: `${owner.firstName} ${owner.lastName}` },
        {},
        context
    );

    return owner;
}

/**
 * Get owner statistics
 * 
 * @returns {Promise<object>} Owner statistics
 */
export async function getOwnerStats() {
    await connectDB();
    const Owner = getOwnerModel();

    const stats = await Owner.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    const result = {
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
        suspended: 0,
    };

    for (const stat of stats) {
        result[stat._id] = stat.count;
        result.total += stat.count;
    }

    return result;
}

export default {
    createOwner,
    getOwnerById,
    getOwnerByEmail,
    getOwnerByUserId,
    listOwners,
    updateOwner,
    updateOwnerTaxInfo,
    updateOwnerBankInfo,
    getOwnerSensitiveInfo,
    addOwnerNote,
    linkOwnerToUser,
    deleteOwner,
    getOwnerStats,
};
