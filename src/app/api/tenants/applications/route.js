import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import tenantsService from '@/modules/tenants/tenants.service';

/**
 * GET /api/tenants/applications
 * List all tenant applications
 */
export async function GET(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'leasing_agent'])(async () => {
            try {
                const { searchParams } = new URL(req.url);
                const page = parseInt(searchParams.get('page')) || 1;
                const limit = parseInt(searchParams.get('limit')) || 20;
                const status = searchParams.get('status');
                const propertyId = searchParams.get('propertyId');

                const result = await tenantsService.listApplications(
                    { status, propertyId },
                    { page, limit }
                );

                return NextResponse.json(result);
            } catch (error) {
                console.error('List applications error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to list applications' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * POST /api/tenants/applications
 * Create a new tenant application
 */
export async function POST(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'leasing_agent'])(async () => {
            try {
                const body = await req.json();

                const application = await tenantsService.createApplication(
                    body,
                    user,
                    { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' }
                );

                return NextResponse.json(application, { status: 201 });
            } catch (error) {
                console.error('Create application error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to create application' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
