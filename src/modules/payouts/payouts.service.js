import { connectDB } from '@/lib/db/mongoose';
import { getOwnerStatementModel, getPayoutModel, getPayoutRunModel } from './payouts.model';
import { getOwnerModel } from '@/modules/owners/owners.model';
import { getPropertyAssignmentModel } from '@/modules/properties/properties.model';
import { getUnpaidoutEntries, markEntriesAsPaidOut, recordOwnerPayout } from '@/modules/ledger/ledger.service';
import { auditActions } from '@/lib/audit/audit.service';

/**
 * Payouts Service
 * Handles statement generation and owner payouts
 */

/**
 * Generate owner statement for a period
 * Creates an IMMUTABLE snapshot of owner financials
 */
export async function generateOwnerStatement(ownerId, periodStart, periodEnd, actor, context = {}) {
    await connectDB();
    const OwnerStatement = getOwnerStatementModel();
    const Owner = getOwnerModel();
    const PropertyAssignment = getPropertyAssignmentModel();

    // Get owner
    const owner = await Owner.findById(ownerId);
    if (!owner) {
        throw new Error('Owner not found');
    }

    // Get owner's property assignments
    const assignments = await PropertyAssignment.find({
        owner: ownerId,
        status: 'active',
    }).populate('property', 'name address');

    // Get unpaid ledger entries for this owner
    const entries = await getUnpaidoutEntries(ownerId, null, periodEnd);

    // Filter entries within period
    const periodEntries = entries.filter((e) => {
        const effectiveDate = new Date(e.effectiveDate);
        return effectiveDate >= new Date(periodStart) && effectiveDate <= new Date(periodEnd);
    });

    // Calculate totals
    let income = {
        rentCollected: 0,
        lateFees: 0,
        otherIncome: 0,
        totalIncome: 0,
    };

    let expenses = {
        managementFees: 0,
        maintenanceExpenses: 0,
        utilities: 0,
        insurance: 0,
        taxes: 0,
        hoaFees: 0,
        otherExpenses: 0,
        totalExpenses: 0,
    };

    const lineItems = [];

    for (const entry of periodEntries) {
        const lineItem = {
            date: entry.effectiveDate,
            description: entry.description,
            property: entry.property?.toString(),
            unit: entry.unit?.toString(),
            amount: entry.amount,
            ledgerEntryId: entry._id,
        };

        // Categorize by transaction type
        switch (entry.transactionType) {
            case 'rent_payment':
                income.rentCollected += entry.amount;
                lineItem.category = 'income';
                break;
            case 'late_fee':
                income.lateFees += entry.amount;
                lineItem.category = 'income';
                break;
            case 'management_fee':
                expenses.managementFees += Math.abs(entry.amount);
                lineItem.category = 'fee';
                break;
            case 'maintenance_expense':
                expenses.maintenanceExpenses += Math.abs(entry.amount);
                lineItem.category = 'expense';
                break;
            case 'utility_expense':
                expenses.utilities += Math.abs(entry.amount);
                lineItem.category = 'expense';
                break;
            case 'insurance_payment':
                expenses.insurance += Math.abs(entry.amount);
                lineItem.category = 'expense';
                break;
            case 'tax_payment':
                expenses.taxes += Math.abs(entry.amount);
                lineItem.category = 'expense';
                break;
            case 'hoa_payment':
                expenses.hoaFees += Math.abs(entry.amount);
                lineItem.category = 'expense';
                break;
            default:
                if (entry.amount > 0) {
                    income.otherIncome += entry.amount;
                    lineItem.category = 'income';
                } else {
                    expenses.otherExpenses += Math.abs(entry.amount);
                    lineItem.category = 'expense';
                }
        }

        lineItems.push(lineItem);
    }

    // Calculate totals
    income.totalIncome = income.rentCollected + income.lateFees + income.otherIncome;
    expenses.totalExpenses = expenses.managementFees + expenses.maintenanceExpenses +
        expenses.utilities + expenses.insurance + expenses.taxes +
        expenses.hoaFees + expenses.otherExpenses;

    const netIncome = income.totalIncome - expenses.totalExpenses;

    // Calculate ownership split
    // For now, assume single owner (100%)
    const ownershipPercent = 100;
    const ownerShare = netIncome;

    // Create statement
    const statement = new OwnerStatement({
        owner: ownerId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        properties: assignments.map((a) => ({
            property: a.property._id,
            propertyName: a.property.name,
            propertyAddress: a.property.fullAddress,
            ownershipPercent: a.ownershipPercent,
        })),
        income,
        expenses,
        netIncome,
        ownershipSplit: {
            totalNetBeforeSplit: netIncome,
            ownershipPercent,
            ownerShare,
        },
        previousBalance: 0, // TODO: Get from previous statement
        amountDue: ownerShare,
        ledgerEntryIds: periodEntries.map((e) => e._id),
        lineItems,
        status: 'draft',
        createdBy: actor.id,
    });

    await statement.save();

    return statement.toJSON();
}

/**
 * Finalize a statement (make it immutable)
 */
export async function finalizeStatement(statementId, actor, context = {}) {
    await connectDB();
    const OwnerStatement = getOwnerStatementModel();

    const statement = await OwnerStatement.findById(statementId);

    if (!statement) {
        throw new Error('Statement not found');
    }

    if (statement.status !== 'draft') {
        throw new Error('Statement is already finalized');
    }

    statement.status = 'final';
    statement.finalizedAt = new Date();
    statement.finalizedBy = actor.id;

    await statement.save();

    return statement.toJSON();
}

/**
 * Create a payout for a statement
 */
export async function createPayout(statementId, actor, context = {}) {
    await connectDB();
    const OwnerStatement = getOwnerStatementModel();
    const Payout = getPayoutModel();
    const Owner = getOwnerModel();

    const statement = await OwnerStatement.findById(statementId);

    if (!statement) {
        throw new Error('Statement not found');
    }

    if (statement.status !== 'final') {
        throw new Error('Statement must be finalized before creating payout');
    }

    if (statement.payout) {
        throw new Error('Payout already exists for this statement');
    }

    // Get owner's bank info (for snapshot)
    const owner = await Owner.findById(statement.owner);

    const payout = new Payout({
        owner: statement.owner,
        statement: statementId,
        amount: statement.amountDue,
        paymentMethod: owner.bankInfo?.paymentMethod || 'ach',
        bankInfoSnapshot: {
            bankName: owner.bankInfo?.bankName,
            accountLast4: owner.bankInfo?.accountLast4,
            accountType: owner.bankInfo?.accountType,
        },
        status: 'pending',
        createdBy: actor.id,
    });

    await payout.save();

    // Link payout to statement
    statement.payout = payout._id;
    await statement.save();

    // Audit
    await auditActions.payoutInitiated(actor, payout, context);

    return payout.toJSON();
}

/**
 * Approve a payout
 */
export async function approvePayout(payoutId, actor, context = {}) {
    await connectDB();
    const Payout = getPayoutModel();

    const payout = await Payout.findById(payoutId);

    if (!payout) {
        throw new Error('Payout not found');
    }

    if (payout.status !== 'pending') {
        throw new Error('Payout is not pending approval');
    }

    payout.status = 'approved';
    payout.approval.approvedBy = actor.id;
    payout.approval.approvedAt = new Date();
    payout.updatedBy = actor.id;

    await payout.save();

    await auditActions.payoutApproved(actor, payout, context);

    return payout.toJSON();
}

/**
 * Process a payout (mark as completed)
 */
export async function processPayout(payoutId, actor, context = {}) {
    await connectDB();
    const Payout = getPayoutModel();
    const OwnerStatement = getOwnerStatementModel();

    const payout = await Payout.findById(payoutId);

    if (!payout) {
        throw new Error('Payout not found');
    }

    if (payout.status !== 'approved') {
        throw new Error('Payout must be approved before processing');
    }

    // Get statement
    const statement = await OwnerStatement.findById(payout.statement);

    // Create ledger entry for payout
    const ledgerEntry = await recordOwnerPayout(
        {
            amount: payout.amount,
            ownerId: payout.owner,
            payoutId: payout._id,
            paymentDetails: {
                method: payout.paymentMethod,
            },
            periodDescription: `${statement.periodStart.toISOString().split('T')[0]} to ${statement.periodEnd.toISOString().split('T')[0]}`,
            periodStart: statement.periodStart,
            periodEnd: statement.periodEnd,
            effectiveDate: new Date(),
        },
        actor,
        context
    );

    // Mark ledger entries as paid out
    await markEntriesAsPaidOut(
        statement.ledgerEntryIds,
        payout._id,
        new Date()
    );

    // Update payout
    payout.status = 'completed';
    payout.processedDate = new Date();
    payout.completedDate = new Date();
    payout.ledgerEntryId = ledgerEntry._id;
    payout.updatedBy = actor.id;

    await payout.save();

    // Update statement
    statement.status = 'paid';
    await statement.save();

    await auditActions.payoutProcessed(actor, payout, context);

    return payout.toJSON();
}

/**
 * Run monthly payout for all active owners
 */
export async function runMonthlyPayouts(periodStart, periodEnd, actor, context = {}) {
    await connectDB();
    const PayoutRun = getPayoutRunModel();
    const Owner = getOwnerModel();

    // Create payout run
    const run = new PayoutRun({
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status: 'processing',
        startedAt: new Date(),
        createdBy: actor.id,
    });

    await run.save();

    try {
        // Get all active owners
        const owners = await Owner.find({ status: 'active' });

        run.summary.totalOwners = owners.length;

        for (const owner of owners) {
            try {
                // Generate statement
                const statement = await generateOwnerStatement(
                    owner._id,
                    periodStart,
                    periodEnd,
                    actor,
                    context
                );

                run.statements.push(statement._id);
                run.summary.totalStatements++;

                // Finalize statement
                await finalizeStatement(statement._id, actor, context);

                // Create payout
                const payout = await createPayout(statement._id, actor, context);

                run.payouts.push(payout._id);
                run.summary.totalPayouts++;
                run.summary.totalAmount += payout.amount;

            } catch (error) {
                run.errors.push({
                    ownerId: owner._id,
                    error: error.message,
                    timestamp: new Date(),
                });
            }
        }

        run.status = 'completed';
        run.completedAt = new Date();

    } catch (error) {
        run.status = 'failed';
        run.errors.push({
            error: error.message,
            timestamp: new Date(),
        });
    }

    await run.save();

    return run.toJSON();
}

/**
 * Get statement by ID
 */
export async function getStatementById(statementId) {
    await connectDB();
    const OwnerStatement = getOwnerStatementModel();

    return OwnerStatement.findById(statementId)
        .populate('owner', 'firstName lastName email')
        .populate('properties.property', 'name address')
        .lean();
}

/**
 * List statements for an owner
 */
export async function listOwnerStatements(ownerId, options = {}) {
    await connectDB();
    const OwnerStatement = getOwnerStatementModel();

    const { page = 1, limit = 12 } = options;

    const [statements, total] = await Promise.all([
        OwnerStatement.find({ owner: ownerId })
            .sort({ periodEnd: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        OwnerStatement.countDocuments({ owner: ownerId }),
    ]);

    return {
        data: statements,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}

/**
 * Get payout by ID
 */
export async function getPayoutById(payoutId) {
    await connectDB();
    const Payout = getPayoutModel();

    return Payout.findById(payoutId)
        .populate('owner', 'firstName lastName email')
        .populate('statement')
        .lean();
}

/**
 * List payouts for an owner
 */
export async function listOwnerPayouts(ownerId, options = {}) {
    await connectDB();
    const Payout = getPayoutModel();

    const { page = 1, limit = 12 } = options;

    const [payouts, total] = await Promise.all([
        Payout.find({ owner: ownerId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Payout.countDocuments({ owner: ownerId }),
    ]);

    return {
        data: payouts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}

/**
 * Get payout run by ID
 */
export async function getPayoutRunById(runId) {
    await connectDB();
    const PayoutRun = getPayoutRunModel();

    return PayoutRun.findById(runId)
        .populate('payouts')
        .populate('statements')
        .lean();
}

/**
 * List payout runs
 */
export async function listPayoutRuns(options = {}) {
    await connectDB();
    const PayoutRun = getPayoutRunModel();

    const { page = 1, limit = 12 } = options;

    const [runs, total] = await Promise.all([
        PayoutRun.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        PayoutRun.countDocuments(),
    ]);

    return {
        data: runs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}

export default {
    generateOwnerStatement,
    finalizeStatement,
    createPayout,
    approvePayout,
    processPayout,
    runMonthlyPayouts,
    getStatementById,
    listOwnerStatements,
    getPayoutById,
    listOwnerPayouts,
    getPayoutRunById,
    listPayoutRuns,
};
