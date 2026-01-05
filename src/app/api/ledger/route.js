import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import ledgerService from '@/modules/ledger/ledger.service';

/**
 * GET /api/ledger
 * List ledger entries with filters
 */
export async function GET(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'accountant'])(async () => {
            try {
                const { searchParams } = new URL(req.url);
                const page = parseInt(searchParams.get('page')) || 1;
                const limit = parseInt(searchParams.get('limit')) || 50;
                const accountType = searchParams.get('accountType');
                const propertyId = searchParams.get('propertyId');
                const ownerId = searchParams.get('ownerId');
                const tenantId = searchParams.get('tenantId');
                const startDate = searchParams.get('startDate');
                const endDate = searchParams.get('endDate');

                const result = await ledgerService.listEntries(
                    { accountType, propertyId, ownerId, tenantId, startDate, endDate },
                    { page, limit }
                );

                return NextResponse.json(result);
            } catch (error) {
                console.error('List ledger entries error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to list ledger entries' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * POST /api/ledger
 * Create a ledger entry (for internal use)
 */
export async function POST(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'accountant'])(async () => {
            try {
                const body = await req.json();

                const entry = await ledgerService.createEntry(
                    body,
                    user,
                    { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' }
                );

                return NextResponse.json(entry, { status: 201 });
            } catch (error) {
                console.error('Create ledger entry error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to create ledger entry' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
