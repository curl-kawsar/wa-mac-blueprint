import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import payoutsService from '@/modules/payouts/payouts.service';

/**
 * GET /api/payouts/statements
 * List owner statements
 */
export async function GET(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'accountant', 'owner'])(async () => {
            try {
                const { searchParams } = new URL(req.url);
                const page = parseInt(searchParams.get('page')) || 1;
                const limit = parseInt(searchParams.get('limit')) || 12;
                let ownerId = searchParams.get('ownerId');

                // If owner role, force to their own owner ID
                if (user.role === 'owner') {
                    ownerId = user.ownerId;
                }

                if (!ownerId) {
                    return NextResponse.json(
                        { error: 'Owner ID is required' },
                        { status: 400 }
                    );
                }

                const result = await payoutsService.listOwnerStatements(ownerId, { page, limit });

                return NextResponse.json(result);
            } catch (error) {
                console.error('List statements error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to list statements' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
