import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import { connectDB } from '@/lib/db/mongoose';
import { getLeaseModel } from '@/modules/leases/leases.model';

/**
 * GET /api/leases
 * List all leases with pagination
 */
export async function GET(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'leasing_agent', 'accountant'])(async () => {
            try {
                await connectDB();
                const Lease = getLeaseModel();

                const { searchParams } = new URL(req.url);
                const page = parseInt(searchParams.get('page')) || 1;
                const limit = parseInt(searchParams.get('limit')) || 20;
                const status = searchParams.get('status');
                const propertyId = searchParams.get('propertyId');
                const tenantId = searchParams.get('tenantId');

                const query = {};
                if (status) query.status = status;
                if (propertyId) query.property = propertyId;
                if (tenantId) query.tenant = tenantId;

                const [leases, total] = await Promise.all([
                    Lease.find(query)
                        .populate('tenant', 'firstName lastName email')
                        .populate('property', 'name address')
                        .populate('unit', 'unitNumber')
                        .sort({ createdAt: -1 })
                        .skip((page - 1) * limit)
                        .limit(limit)
                        .lean(),
                    Lease.countDocuments(query),
                ]);

                return NextResponse.json({
                    data: leases,
                    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
                });
            } catch (error) {
                console.error('List leases error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to list leases' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * POST /api/leases
 * Create a new lease
 */
export async function POST(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'leasing_agent'])(async () => {
            try {
                await connectDB();
                const Lease = getLeaseModel();

                const body = await req.json();

                const lease = new Lease({
                    ...body,
                    createdBy: user.id,
                });

                await lease.save();

                return NextResponse.json(lease.toJSON(), { status: 201 });
            } catch (error) {
                console.error('Create lease error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to create lease' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
