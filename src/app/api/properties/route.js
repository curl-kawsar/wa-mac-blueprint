import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import propertiesService from '@/modules/properties/properties.service';

/**
 * GET /api/properties
 * List all properties with pagination
 */
export async function GET(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'leasing_agent', 'maintenance_staff', 'accountant'])(async () => {
            try {
                const { searchParams } = new URL(req.url);
                const page = parseInt(searchParams.get('page')) || 1;
                const limit = parseInt(searchParams.get('limit')) || 20;
                const status = searchParams.get('status');
                const search = searchParams.get('search');
                const propertyType = searchParams.get('propertyType');

                const result = await propertiesService.listProperties(
                    { status, search, propertyType },
                    { page, limit }
                );

                return NextResponse.json(result);
            } catch (error) {
                console.error('List properties error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to list properties' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * POST /api/properties
 * Create a new property
 */
export async function POST(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager'])(async () => {
            try {
                const body = await req.json();

                const property = await propertiesService.createProperty(
                    body,
                    user,
                    { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' }
                );

                return NextResponse.json(property, { status: 201 });
            } catch (error) {
                console.error('Create property error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to create property' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
