import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import tenantsService from '@/modules/tenants/tenants.service';

/**
 * GET /api/tenants
 * List all tenants with pagination
 */
export async function GET(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'leasing_agent'])(async () => {
            try {
                const { searchParams } = new URL(req.url);
                const page = parseInt(searchParams.get('page')) || 1;
                const limit = parseInt(searchParams.get('limit')) || 20;
                const status = searchParams.get('status');
                const search = searchParams.get('search');
                const propertyId = searchParams.get('propertyId');

                const result = await tenantsService.listTenants(
                    { status, search, propertyId },
                    { page, limit }
                );

                return NextResponse.json(result);
            } catch (error) {
                console.error('List tenants error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to list tenants' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * POST /api/tenants
 * Create a new tenant (from approved application)
 */
export async function POST(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'leasing_agent'])(async () => {
            try {
                const body = await req.json();

                const tenant = await tenantsService.createTenantFromApplication(
                    body.applicationId,
                    body.tenantData || {},
                    user,
                    { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' }
                );

                return NextResponse.json(tenant, { status: 201 });
            } catch (error) {
                console.error('Create tenant error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to create tenant' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
