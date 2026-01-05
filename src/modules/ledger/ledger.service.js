import { connectDB } from '@/lib/db/mongoose';
import { getLedgerEntryModel } from './ledger.model';
import { logAction } from '@/lib/audit/audit.service';

/**
 * Ledger Service
 * Handles all ledger operations with strict immutability rules
 * 
 * CRITICAL: This service enforces append-only operations
 * - Entries cannot be modified
 * - Entries cannot be deleted
 * - Corrections must be made via reversal entries
 */

/**
 * Create a new ledger entry
 * 
 * @param {object} entryData - Ledger entry data
 * @param {object} actor - User creating the entry
 * @param {object} context - Request context
 * @returns {Promise<object>} Created ledger entry
 */
export async function createEntry(entryData, actor, context = {}) {
    await connectDB();
    const LedgerEntry = getLedgerEntryModel();

    const entry = new LedgerEntry({
        accountType: entryData.accountType,
        transactionType: entryData.transactionType,
        amount: entryData.amount,
        debitCredit: entryData.debitCredit,
        property: entryData.propertyId,
        unit: entryData.unitId,
        owner: entryData.ownerId,
        tenant: entryData.tenantId,
        lease: entryData.leaseId,
        sourceDocument: entryData.sourceDocument,
        paymentDetails: entryData.paymentDetails,
        description: entryData.description,
        notes: entryData.notes,
        periodStart: entryData.periodStart,
        periodEnd: entryData.periodEnd,
        effectiveDate: entryData.effectiveDate || new Date(),
        postedDate: new Date(),
        status: 'posted',
        createdBy: actor.id,
        sourceIp: context.ipAddress,
    });

    await entry.save();

    // Audit log
    await logAction(
        'ledger.entry_created',
        actor,
        { type: 'ledger_entry', id: entry._id, name: entry.entryNumber },
        {
            after: {
                accountType: entry.accountType,
                transactionType: entry.transactionType,
                amount: entry.amount,
            },
        },
        context
    );

    return entry.toJSON();
}

/**
 * Create a rent payment entry
 */
export async function recordRentPayment(paymentData, actor, context = {}) {
    return createEntry(
        {
            accountType: 'trust_rent',
            transactionType: 'rent_payment',
            amount: paymentData.amount,
            debitCredit: 'credit',
            propertyId: paymentData.propertyId,
            unitId: paymentData.unitId,
            ownerId: paymentData.ownerId,
            tenantId: paymentData.tenantId,
            leaseId: paymentData.leaseId,
            sourceDocument: {
                type: 'invoice',
                id: paymentData.invoiceId,
                number: paymentData.invoiceNumber,
            },
            paymentDetails: paymentData.paymentDetails,
            description: `Rent payment for ${paymentData.periodDescription || 'monthly rent'}`,
            periodStart: paymentData.periodStart,
            periodEnd: paymentData.periodEnd,
            effectiveDate: paymentData.effectiveDate,
        },
        actor,
        context
    );
}

/**
 * Create a security deposit entry
 */
export async function recordSecurityDeposit(depositData, actor, context = {}) {
    return createEntry(
        {
            accountType: 'trust_deposit',
            transactionType: 'security_deposit',
            amount: depositData.amount,
            debitCredit: 'credit',
            propertyId: depositData.propertyId,
            unitId: depositData.unitId,
            ownerId: depositData.ownerId,
            tenantId: depositData.tenantId,
            leaseId: depositData.leaseId,
            paymentDetails: depositData.paymentDetails,
            description: 'Security deposit received',
            effectiveDate: depositData.effectiveDate,
        },
        actor,
        context
    );
}

/**
 * Create a deposit refund entry
 */
export async function recordDepositRefund(refundData, actor, context = {}) {
    return createEntry(
        {
            accountType: 'trust_deposit',
            transactionType: 'deposit_refund',
            amount: -Math.abs(refundData.amount), // Negative for outflow
            debitCredit: 'debit',
            propertyId: refundData.propertyId,
            unitId: refundData.unitId,
            ownerId: refundData.ownerId,
            tenantId: refundData.tenantId,
            leaseId: refundData.leaseId,
            description: `Security deposit refund${refundData.deductions ? ' (after deductions)' : ''}`,
            notes: refundData.notes,
            effectiveDate: refundData.effectiveDate,
        },
        actor,
        context
    );
}

/**
 * Create a management fee entry
 */
export async function recordManagementFee(feeData, actor, context = {}) {
    return createEntry(
        {
            accountType: 'company_revenue',
            transactionType: 'management_fee',
            amount: feeData.amount,
            debitCredit: 'credit',
            propertyId: feeData.propertyId,
            ownerId: feeData.ownerId,
            sourceDocument: feeData.sourceDocument,
            description: `Management fee (${feeData.feePercent || 0}%)`,
            periodStart: feeData.periodStart,
            periodEnd: feeData.periodEnd,
            effectiveDate: feeData.effectiveDate,
        },
        actor,
        context
    );
}

/**
 * Create an expense entry
 */
export async function recordExpense(expenseData, actor, context = {}) {
    return createEntry(
        {
            accountType: 'expenses',
            transactionType: expenseData.expenseType || 'expense',
            amount: -Math.abs(expenseData.amount), // Negative for expenses
            debitCredit: 'debit',
            propertyId: expenseData.propertyId,
            unitId: expenseData.unitId,
            ownerId: expenseData.ownerId,
            sourceDocument: expenseData.sourceDocument,
            description: expenseData.description,
            notes: expenseData.notes,
            effectiveDate: expenseData.effectiveDate,
        },
        actor,
        context
    );
}

/**
 * Create an owner payout entry
 */
export async function recordOwnerPayout(payoutData, actor, context = {}) {
    return createEntry(
        {
            accountType: 'trust_rent',
            transactionType: 'owner_payout',
            amount: -Math.abs(payoutData.amount), // Negative for outflow
            debitCredit: 'debit',
            propertyId: payoutData.propertyId,
            ownerId: payoutData.ownerId,
            sourceDocument: {
                type: 'payout',
                id: payoutData.payoutId,
            },
            paymentDetails: payoutData.paymentDetails,
            description: `Owner payout for period ${payoutData.periodDescription}`,
            periodStart: payoutData.periodStart,
            periodEnd: payoutData.periodEnd,
            effectiveDate: payoutData.effectiveDate,
        },
        actor,
        context
    );
}

/**
 * Create a reversal entry for an existing entry
 * This is the only way to "correct" a ledger entry
 */
export async function createReversalEntry(originalEntryId, reason, actor, context = {}) {
    await connectDB();
    const LedgerEntry = getLedgerEntryModel();

    const originalEntry = await LedgerEntry.findById(originalEntryId);

    if (!originalEntry) {
        throw new Error('Original entry not found');
    }

    if (originalEntry.status === 'reversed') {
        throw new Error('Entry has already been reversed');
    }

    // Create reversal entry (opposite amount)
    const reversalEntry = new LedgerEntry({
        accountType: originalEntry.accountType,
        transactionType: 'reversal',
        amount: -originalEntry.amount,
        debitCredit: originalEntry.debitCredit === 'credit' ? 'debit' : 'credit',
        property: originalEntry.property,
        unit: originalEntry.unit,
        owner: originalEntry.owner,
        tenant: originalEntry.tenant,
        lease: originalEntry.lease,
        reversalOf: originalEntry._id,
        description: `Reversal of ${originalEntry.entryNumber}: ${reason}`,
        notes: reason,
        effectiveDate: new Date(),
        postedDate: new Date(),
        status: 'posted',
        createdBy: actor.id,
        sourceIp: context.ipAddress,
    });

    await reversalEntry.save();

    // Mark original as reversed (using direct MongoDB update to bypass schema restrictions)
    await LedgerEntry.collection.updateOne(
        { _id: originalEntry._id },
        {
            $set: {
                status: 'reversed',
                reversedBy: reversalEntry._id,
            },
        }
    );

    return reversalEntry.toJSON();
}

/**
 * Get ledger entry by ID
 */
export async function getEntryById(entryId) {
    await connectDB();
    const LedgerEntry = getLedgerEntryModel();

    return LedgerEntry.findById(entryId)
        .populate('property', 'name address')
        .populate('owner', 'firstName lastName')
        .populate('tenant', 'firstName lastName')
        .lean();
}

/**
 * Query ledger entries with filters
 */
export async function queryEntries(filters = {}, options = {}) {
    await connectDB();
    const LedgerEntry = getLedgerEntryModel();

    const {
        page = 1,
        limit = 50,
        sortBy = 'effectiveDate',
        sortOrder = 'desc',
    } = options;

    const query = {};

    if (filters.accountType) {
        query.accountType = filters.accountType;
    }

    if (filters.transactionType) {
        query.transactionType = filters.transactionType;
    }

    if (filters.propertyId) {
        query.property = filters.propertyId;
    }

    if (filters.ownerId) {
        query.owner = filters.ownerId;
    }

    if (filters.tenantId) {
        query.tenant = filters.tenantId;
    }

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
        query.effectiveDate = {};
        if (filters.startDate) {
            query.effectiveDate.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            query.effectiveDate.$lte = new Date(filters.endDate);
        }
    }

    const [entries, total] = await Promise.all([
        LedgerEntry.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('property', 'name')
            .populate('owner', 'firstName lastName')
            .populate('tenant', 'firstName lastName')
            .lean(),
        LedgerEntry.countDocuments(query),
    ]);

    return {
        data: entries,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}

/**
 * Get balance for a specific account type and property/owner
 */
export async function getBalance(accountType, filters = {}) {
    await connectDB();
    const LedgerEntry = getLedgerEntryModel();

    const match = {
        accountType,
        status: 'posted',
    };

    if (filters.propertyId) {
        match.property = filters.propertyId;
    }

    if (filters.ownerId) {
        match.owner = filters.ownerId;
    }

    if (filters.tenantId) {
        match.tenant = filters.tenantId;
    }

    if (filters.endDate) {
        match.effectiveDate = { $lte: new Date(filters.endDate) };
    }

    const result = await LedgerEntry.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                balance: { $sum: '$amount' },
                creditTotal: {
                    $sum: { $cond: [{ $eq: ['$debitCredit', 'credit'] }, '$amount', 0] },
                },
                debitTotal: {
                    $sum: { $cond: [{ $eq: ['$debitCredit', 'debit'] }, { $abs: '$amount' }, 0] },
                },
                entryCount: { $sum: 1 },
            },
        },
    ]);

    return result[0] || { balance: 0, creditTotal: 0, debitTotal: 0, entryCount: 0 };
}

/**
 * Get entries not yet included in a payout
 */
export async function getUnpaidoutEntries(ownerId, propertyId, endDate) {
    await connectDB();
    const LedgerEntry = getLedgerEntryModel();

    const query = {
        accountType: 'trust_rent',
        status: 'posted',
        'includedInPayout.payoutId': { $exists: false },
        effectiveDate: { $lte: new Date(endDate) },
    };

    if (ownerId) {
        query.owner = ownerId;
    }

    if (propertyId) {
        query.property = propertyId;
    }

    return LedgerEntry.find(query)
        .sort({ effectiveDate: 1 })
        .lean();
}

/**
 * Mark entries as included in payout
 */
export async function markEntriesAsPaidOut(entryIds, payoutId, payoutDate) {
    await connectDB();
    const LedgerEntry = getLedgerEntryModel();

    // Use direct MongoDB update to bypass schema restrictions
    await LedgerEntry.collection.updateMany(
        { _id: { $in: entryIds } },
        {
            $set: {
                'includedInPayout.payoutId': payoutId,
                'includedInPayout.payoutDate': payoutDate,
            },
        }
    );
}

/**
 * Get ledger summary for a property
 */
export async function getPropertyLedgerSummary(propertyId, startDate, endDate) {
    await connectDB();
    const LedgerEntry = getLedgerEntryModel();

    const match = {
        property: propertyId,
        status: 'posted',
    };

    if (startDate || endDate) {
        match.effectiveDate = {};
        if (startDate) match.effectiveDate.$gte = new Date(startDate);
        if (endDate) match.effectiveDate.$lte = new Date(endDate);
    }

    const summary = await LedgerEntry.aggregate([
        { $match: match },
        {
            $group: {
                _id: {
                    accountType: '$accountType',
                    transactionType: '$transactionType',
                },
                total: { $sum: '$amount' },
                count: { $sum: 1 },
            },
        },
        {
            $group: {
                _id: '$_id.accountType',
                transactions: {
                    $push: {
                        type: '$_id.transactionType',
                        total: '$total',
                        count: '$count',
                    },
                },
                accountTotal: { $sum: '$total' },
            },
        },
    ]);

    return summary;
}

export default {
    createEntry,
    recordRentPayment,
    recordSecurityDeposit,
    recordDepositRefund,
    recordManagementFee,
    recordExpense,
    recordOwnerPayout,
    createReversalEntry,
    getEntryById,
    queryEntries,
    getBalance,
    getUnpaidoutEntries,
    markEntriesAsPaidOut,
    getPropertyLedgerSummary,
};
