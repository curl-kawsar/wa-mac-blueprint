import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import { connectDB } from '@/lib/db/mongoose';
import { getMaintenanceRequestModel } from '@/modules/maintenance/maintenance.model';

/**
 * GET /api/maintenance
 * List maintenance requests
 */
export async function GET(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'maintenance_staff'])(async () => {
            try {
                await connectDB();
                const MaintenanceRequest = getMaintenanceRequestModel();

                const { searchParams } = new URL(req.url);
                const page = parseInt(searchParams.get('page')) || 1;
                const limit = parseInt(searchParams.get('limit')) || 20;
                const status = searchParams.get('status');
                const priority = searchParams.get('priority');
                const propertyId = searchParams.get('propertyId');
                const assignedTo = searchParams.get('assignedTo');

                const query = {};
                if (status) query.status = status;
                if (priority) query.priority = priority;
                if (propertyId) query.property = propertyId;
                if (assignedTo) query.assignedTo = assignedTo;

                const [requests, total] = await Promise.all([
                    MaintenanceRequest.find(query)
                        .populate('property', 'name')
                        .populate('unit', 'unitNumber')
                        .populate('tenant', 'firstName lastName')
                        .populate('assignedTo', 'firstName lastName')
                        .sort({ createdAt: -1 })
                        .skip((page - 1) * limit)
                        .limit(limit)
                        .lean(),
                    MaintenanceRequest.countDocuments(query),
                ]);

                return NextResponse.json({
                    data: requests,
                    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
                });
            } catch (error) {
                console.error('List maintenance requests error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to list maintenance requests' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * POST /api/maintenance
 * Create a maintenance request
 */
export async function POST(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'maintenance_staff', 'tenant'])(async () => {
            try {
                await connectDB();
                const MaintenanceRequest = getMaintenanceRequestModel();

                const body = await req.json();

                const maintenanceRequest = new MaintenanceRequest({
                    ...body,
                    status: 'submitted',
                    createdBy: user.id,
                });

                await maintenanceRequest.save();

                return NextResponse.json(maintenanceRequest.toJSON(), { status: 201 });
            } catch (error) {
                console.error('Create maintenance request error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to create maintenance request' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
