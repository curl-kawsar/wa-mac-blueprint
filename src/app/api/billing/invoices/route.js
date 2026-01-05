import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import { connectDB } from '@/lib/db/mongoose';
import { getInvoiceModel } from '@/modules/billing/billing.model';

/**
 * GET /api/billing/invoices
 * List all invoices
 */
export async function GET(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'accountant'])(async () => {
            try {
                await connectDB();
                const Invoice = getInvoiceModel();

                const { searchParams } = new URL(req.url);
                const page = parseInt(searchParams.get('page')) || 1;
                const limit = parseInt(searchParams.get('limit')) || 20;
                const status = searchParams.get('status');
                const tenantId = searchParams.get('tenantId');
                const leaseId = searchParams.get('leaseId');

                const query = {};
                if (status) query.status = status;
                if (tenantId) query.tenant = tenantId;
                if (leaseId) query.lease = leaseId;

                const [invoices, total] = await Promise.all([
                    Invoice.find(query)
                        .populate('tenant', 'firstName lastName email')
                        .populate('property', 'name')
                        .sort({ dueDate: -1 })
                        .skip((page - 1) * limit)
                        .limit(limit)
                        .lean(),
                    Invoice.countDocuments(query),
                ]);

                return NextResponse.json({
                    data: invoices,
                    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
                });
            } catch (error) {
                console.error('List invoices error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to list invoices' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * POST /api/billing/invoices
 * Create a new invoice
 */
export async function POST(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'accountant'])(async () => {
            try {
                await connectDB();
                const Invoice = getInvoiceModel();

                const body = await req.json();

                // Calculate total from line items
                const total = body.lineItems?.reduce((sum, item) => sum + item.amount, 0) || 0;

                const invoice = new Invoice({
                    ...body,
                    total,
                    balanceDue: total,
                    createdBy: user.id,
                });

                await invoice.save();

                return NextResponse.json(invoice.toJSON(), { status: 201 });
            } catch (error) {
                console.error('Create invoice error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to create invoice' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
