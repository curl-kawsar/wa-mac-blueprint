import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import payoutsService from '@/modules/payouts/payouts.service';

/**
 * GET /api/payouts
 * List payouts
 */
export async function GET(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'accountant'])(async () => {
            try {
                const { searchParams } = new URL(req.url);
                const page = parseInt(searchParams.get('page')) || 1;
                const limit = parseInt(searchParams.get('limit')) || 20;
                const ownerId = searchParams.get('ownerId');

                let result;
                if (ownerId) {
                    result = await payoutsService.listOwnerPayouts(ownerId, { page, limit });
                } else {
                    // For admin view - list all payouts
                    result = await payoutsService.listPayoutRuns({ page, limit });
                }

                return NextResponse.json(result);
            } catch (error) {
                console.error('List payouts error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to list payouts' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * POST /api/payouts
 * Initiate a payout run
 */
export async function POST(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'accountant'])(async () => {
            try {
                const body = await req.json();
                const { periodStart, periodEnd } = body;

                const run = await payoutsService.runMonthlyPayouts(
                    periodStart,
                    periodEnd,
                    user,
                    { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' }
                );

                return NextResponse.json(run, { status: 201 });
            } catch (error) {
                console.error('Create payout run error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to create payout run' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
