import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import propertiesService from '@/modules/properties/properties.service';

/**
 * GET /api/properties/[id]/units
 * List units for a property
 */
export async function GET(request, { params }) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'leasing_agent', 'maintenance_staff'])(async () => {
            try {
                const { id } = await params;
                const { searchParams } = new URL(req.url);
                const page = parseInt(searchParams.get('page')) || 1;
                const limit = parseInt(searchParams.get('limit')) || 50;
                const status = searchParams.get('status');

                const result = await propertiesService.listUnits(
                    { propertyId: id, status },
                    { page, limit }
                );

                return NextResponse.json(result);
            } catch (error) {
                console.error('List units error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to list units' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * POST /api/properties/[id]/units
 * Create a unit for a property
 */
export async function POST(request, { params }) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager'])(async () => {
            try {
                const { id } = await params;
                const body = await req.json();

                const unit = await propertiesService.createUnit(
                    { ...body, propertyId: id },
                    user,
                    { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' }
                );

                return NextResponse.json(unit, { status: 201 });
            } catch (error) {
                console.error('Create unit error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to create unit' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
