import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import { validate } from '@/modules/owners/owners.schema';
import {
    updateOwnerSchema,
    updateTaxInfoSchema,
    updateBankInfoSchema,
    addNoteSchema,
} from '@/modules/owners/owners.schema';
import ownersService from '@/modules/owners/owners.service';

/**
 * GET /api/owners/[id]
 * Get owner by ID
 */
export async function GET(request, { params }) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'accountant'])(async () => {
            try {
                const { id } = await params;
                const owner = await ownersService.getOwnerById(id);

                if (!owner) {
                    return NextResponse.json(
                        { error: 'Owner not found' },
                        { status: 404 }
                    );
                }

                return NextResponse.json(owner);
            } catch (error) {
                console.error('Get owner error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to get owner' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * PATCH /api/owners/[id]
 * Update owner
 */
export async function PATCH(request, { params }) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager'])(async () => {
            try {
                const { id } = await params;
                const body = await req.json();

                const validation = validate(updateOwnerSchema, body);
                if (!validation.success) {
                    return NextResponse.json(
                        { error: 'Validation error', details: validation.errors },
                        { status: 400 }
                    );
                }

                const owner = await ownersService.updateOwner(
                    id,
                    validation.data,
                    user,
                    { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' }
                );

                return NextResponse.json(owner);
            } catch (error) {
                console.error('Update owner error:', error);

                if (error.message === 'Owner not found') {
                    return NextResponse.json(
                        { error: error.message },
                        { status: 404 }
                    );
                }

                return NextResponse.json(
                    { error: error.message || 'Failed to update owner' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}

/**
 * DELETE /api/owners/[id]
 * Delete (soft) an owner
 */
export async function DELETE(request, { params }) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin'])(async () => {
            try {
                const { id } = await params;

                await ownersService.deleteOwner(
                    id,
                    user,
                    { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' }
                );

                return NextResponse.json({ message: 'Owner deleted successfully' });
            } catch (error) {
                console.error('Delete owner error:', error);

                if (error.message === 'Owner not found') {
                    return NextResponse.json(
                        { error: error.message },
                        { status: 404 }
                    );
                }

                return NextResponse.json(
                    { error: error.message || 'Failed to delete owner' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
