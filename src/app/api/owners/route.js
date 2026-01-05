import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import { validate } from '@/modules/owners/owners.schema';
import {
    createOwnerSchema,
    updateOwnerSchema,
    queryOwnersSchema,
    updateTaxInfoSchema,
    updateBankInfoSchema,
    addNoteSchema,
} from '@/modules/owners/owners.schema';
import ownersService from '@/modules/owners/owners.service';

/**
 * GET /api/owners
 * List all owners with pagination
 */
export async function GET(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'accountant'])(async () => {
            try {
                const { searchParams } = new URL(req.url);
                const queryParams = Object.fromEntries(searchParams);

                const validation = validate(queryOwnersSchema, queryParams);
                if (!validation.success) {
                    return NextResponse.json(
                        { error: 'Validation error', details: validation.errors },
                        { status: 400 }
                    );
                }

                const { page, limit, status, search, sortBy, sortOrder } = validation.data;

                const result = await ownersService.listOwners(
                    { status, search },
                    { page, limit, sortBy, sortOrder }
                );

                return NextResponse.json(result);
            } catch (error) {
                console.error('List owners error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to list owners' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * POST /api/owners
 * Create a new owner
 */
export async function POST(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager'])(async () => {
            try {
                const body = await req.json();

                const validation = validate(createOwnerSchema, body);
                if (!validation.success) {
                    return NextResponse.json(
                        { error: 'Validation error', details: validation.errors },
                        { status: 400 }
                    );
                }

                const owner = await ownersService.createOwner(
                    validation.data,
                    user,
                    { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' }
                );

                return NextResponse.json(owner, { status: 201 });
            } catch (error) {
                console.error('Create owner error:', error);

                if (error.message.includes('already exists')) {
                    return NextResponse.json(
                        { error: error.message },
                        { status: 409 }
                    );
                }

                return NextResponse.json(
                    { error: error.message || 'Failed to create owner' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
