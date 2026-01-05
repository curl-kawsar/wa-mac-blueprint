import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/mongoose';

/**
 * Audit Log Schema
 * Tracks sensitive operations for compliance and security
 */
const auditLogSchema = new mongoose.Schema(
    {
        // Action performed
        action: {
            type: String,
            required: true,
            index: true,
            enum: [
                // User actions
                'user.created',
                'user.updated',
                'user.deleted',
                'user.role_changed',
                'user.password_changed',
                'user.login',
                'user.logout',
                'user.login_failed',

                // Owner actions
                'owner.created',
                'owner.updated',
                'owner.deleted',
                'owner.bank_info_changed',
                'owner.ssn_viewed',

                // Property actions
                'property.created',
                'property.updated',
                'property.deleted',
                'property.assigned',

                // Lease actions
                'lease.created',
                'lease.updated',
                'lease.terminated',
                'lease.renewed',

                // Payment actions
                'payment.received',
                'payment.refunded',

                // Payout actions
                'payout.initiated',
                'payout.approved',
                'payout.processed',
                'payout.failed',

                // Statement actions
                'statement.generated',

                // Ledger actions
                'ledger.entry_created',

                // Maintenance actions
                'maintenance.created',
                'maintenance.approved',
                'maintenance.completed',

                // Document actions
                'document.uploaded',
                'document.deleted',
                'document.accessed',

                // System actions
                'system.config_changed',
            ],
        },

        // Actor who performed the action
        actor: {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                index: true,
            },
            email: String,
            role: String,
            ipAddress: String,
            userAgent: String,
        },

        // Resource affected
        resource: {
            type: {
                type: String,
                required: true,
                enum: [
                    'user',
                    'owner',
                    'property',
                    'unit',
                    'tenant',
                    'lease',
                    'invoice',
                    'ledger_entry',
                    'payout',
                    'statement',
                    'maintenance',
                    'document',
                    'ticket',
                    'system',
                ],
            },
            id: {
                type: mongoose.Schema.Types.ObjectId,
                index: true,
            },
            name: String,
        },

        // Details of the change
        details: {
            // Previous values (for updates)
            before: mongoose.Schema.Types.Mixed,
            // New values
            after: mongoose.Schema.Types.Mixed,
            // Additional context
            metadata: mongoose.Schema.Types.Mixed,
        },

        // Request context
        context: {
            requestId: String,
            sessionId: String,
            route: String,
            method: String,
        },

        // Result of the action
        result: {
            type: String,
            enum: ['success', 'failure', 'partial'],
            default: 'success',
        },

        // Error details if failed
        error: {
            message: String,
            code: String,
        },

        // Timestamp
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: false,
        collection: 'audit_logs',
    }
);

// Compound indexes for common queries
auditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
auditLogSchema.index({ 'resource.type': 1, 'resource.id': 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index to automatically delete old logs (optional, set to 2 years)
// auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

/**
 * Get the AuditLog model
 * Handles model caching for hot reload
 */
function getAuditLogModel() {
    return mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
}

/**
 * Create an audit log entry
 * 
 * @param {object} logData - Audit log data
 * @returns {Promise<object>} Created audit log
 */
export async function createAuditLog(logData) {
    await connectDB();
    const AuditLog = getAuditLogModel();

    const log = new AuditLog({
        ...logData,
        timestamp: new Date(),
    });

    await log.save();
    return log.toObject();
}

/**
 * Log a user action
 * 
 * @param {string} action - Action type
 * @param {object} actor - Actor information
 * @param {object} resource - Resource affected
 * @param {object} details - Change details
 * @param {object} context - Request context
 */
export async function logAction(action, actor, resource, details = {}, context = {}) {
    try {
        await createAuditLog({
            action,
            actor: {
                userId: actor.id || actor.userId,
                email: actor.email,
                role: actor.role,
                ipAddress: actor.ipAddress,
                userAgent: actor.userAgent,
            },
            resource,
            details,
            context,
            result: 'success',
        });
    } catch (error) {
        // Log to console but don't fail the main operation
        console.error('Failed to create audit log:', error);
    }
}

/**
 * Log a failed action
 */
export async function logFailure(action, actor, resource, error, context = {}) {
    try {
        await createAuditLog({
            action,
            actor: {
                userId: actor?.id || actor?.userId,
                email: actor?.email,
                role: actor?.role,
                ipAddress: actor?.ipAddress,
                userAgent: actor?.userAgent,
            },
            resource,
            result: 'failure',
            error: {
                message: error.message,
                code: error.code,
            },
            context,
        });
    } catch (err) {
        console.error('Failed to create audit log:', err);
    }
}

/**
 * Query audit logs
 * 
 * @param {object} filters - Query filters
 * @param {object} options - Query options (pagination, sorting)
 * @returns {Promise<object>} Paginated audit logs
 */
export async function queryAuditLogs(filters = {}, options = {}) {
    await connectDB();
    const AuditLog = getAuditLogModel();

    const {
        page = 1,
        limit = 50,
        sortBy = 'timestamp',
        sortOrder = 'desc',
    } = options;

    const query = {};

    if (filters.action) {
        query.action = filters.action;
    }

    if (filters.actorId) {
        query['actor.userId'] = filters.actorId;
    }

    if (filters.resourceType) {
        query['resource.type'] = filters.resourceType;
    }

    if (filters.resourceId) {
        query['resource.id'] = filters.resourceId;
    }

    if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) {
            query.timestamp.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            query.timestamp.$lte = new Date(filters.endDate);
        }
    }

    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        AuditLog.countDocuments(query),
    ]);

    return {
        data: logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(resourceType, resourceId, options = {}) {
    return queryAuditLogs(
        { resourceType, resourceId },
        options
    );
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(userId, options = {}) {
    return queryAuditLogs(
        { actorId: userId },
        options
    );
}

// Convenience functions for common audit actions
export const auditActions = {
    // User actions
    userCreated: (actor, user, context) =>
        logAction('user.created', actor, { type: 'user', id: user._id, name: user.email }, { after: { email: user.email, role: user.role } }, context),

    userRoleChanged: (actor, user, oldRole, newRole, context) =>
        logAction('user.role_changed', actor, { type: 'user', id: user._id, name: user.email }, { before: { role: oldRole }, after: { role: newRole } }, context),

    userLogin: (actor, context) =>
        logAction('user.login', actor, { type: 'user', id: actor.id, name: actor.email }, {}, context),

    userLoginFailed: (email, reason, context) =>
        logFailure('user.login_failed', { email }, { type: 'user', name: email }, { message: reason }, context),

    // Owner actions
    ownerBankInfoChanged: (actor, owner, context) =>
        logAction('owner.bank_info_changed', actor, { type: 'owner', id: owner._id, name: owner.name }, { metadata: { changed: true } }, context),

    ownerSSNViewed: (actor, owner, context) =>
        logAction('owner.ssn_viewed', actor, { type: 'owner', id: owner._id, name: owner.name }, {}, context),

    // Lease actions
    leaseCreated: (actor, lease, context) =>
        logAction('lease.created', actor, { type: 'lease', id: lease._id }, { after: { tenantId: lease.tenant, unitId: lease.unit } }, context),

    leaseTerminated: (actor, lease, reason, context) =>
        logAction('lease.terminated', actor, { type: 'lease', id: lease._id }, { metadata: { reason } }, context),

    // Payout actions
    payoutInitiated: (actor, payout, context) =>
        logAction('payout.initiated', actor, { type: 'payout', id: payout._id }, { after: { amount: payout.amount, ownerId: payout.owner } }, context),

    payoutApproved: (actor, payout, context) =>
        logAction('payout.approved', actor, { type: 'payout', id: payout._id }, {}, context),

    payoutProcessed: (actor, payout, context) =>
        logAction('payout.processed', actor, { type: 'payout', id: payout._id }, { after: { status: 'processed' } }, context),
};

export default {
    createAuditLog,
    logAction,
    logFailure,
    queryAuditLogs,
    getResourceAuditLogs,
    getUserAuditLogs,
    auditActions,
};
