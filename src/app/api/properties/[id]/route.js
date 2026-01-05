import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import propertiesService from '@/modules/properties/properties.service';

/**
 * GET /api/properties/[id]
 */
export async function GET(request, { params }) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'leasing_agent', 'maintenance_staff', 'accountant'])(async () => {
            try {
                const { id } = await params;
                const property = await propertiesService.getPropertyById(id);

                if (!property) {
                    return NextResponse.json(
                        { error: 'Property not found' },
                        { status: 404 }
                    );
                }

                return NextResponse.json(property);
            } catch (error) {
                console.error('Get property error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to get property' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * PATCH /api/properties/[id]
 */
export async function PATCH(request, { params }) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager'])(async () => {
            try {
                const { id } = await params;
                const body = await req.json();

                const property = await propertiesService.updateProperty(
                    id,
                    body,
                    user,
                    { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' }
                );

                return NextResponse.json(property);
            } catch (error) {
                console.error('Update property error:', error);

                if (error.message === 'Property not found') {
                    return NextResponse.json({ error: error.message }, { status: 404 });
                }

                return NextResponse.json(
                    { error: error.message || 'Failed to update property' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * DELETE /api/properties/[id]
 */
export async function DELETE(request, { params }) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin'])(async () => {
            try {
                const { id } = await params;

                await propertiesService.deleteProperty(
                    id,
                    user,
                    { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' }
                );

                return NextResponse.json({ message: 'Property deleted successfully' });
            } catch (error) {
                console.error('Delete property error:', error);

                if (error.message === 'Property not found') {
                    return NextResponse.json({ error: error.message }, { status: 404 });
                }

                return NextResponse.json(
                    { error: error.message || 'Failed to delete property' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
