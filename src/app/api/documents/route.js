import { NextResponse } from 'next/server';
import { withAuth, withRole } from '@/lib/rbac/middleware';
import documentsService from '@/modules/documents/documents.service';

/**
 * GET /api/documents
 * List documents
 */
export async function GET(request) {
    return withAuth(async (req, user) => {
        try {
            const { searchParams } = new URL(req.url);
            const page = parseInt(searchParams.get('page')) || 1;
            const limit = parseInt(searchParams.get('limit')) || 20;
            const category = searchParams.get('category');
            const ownerId = searchParams.get('ownerId');
            const tenantId = searchParams.get('tenantId');
            const propertyId = searchParams.get('propertyId');
            const leaseId = searchParams.get('leaseId');

            const result = await documentsService.listDocuments(
                { category, ownerId, tenantId, propertyId, leaseId },
                { page, limit },
                user
            );

            return NextResponse.json(result);
        } catch (error) {
            console.error('List documents error:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to list documents' },
                { status: 500 }
            );
        }
    })(request);
}

/**
 * POST /api/documents
 * Upload a document
 */
export async function POST(request) {
    return withAuth(async (req, user) => {
        return withRole(['super_admin', 'admin', 'property_manager', 'leasing_agent', 'accountant'])(async () => {
            try {
                const formData = await req.formData();
                const file = formData.get('file');
                const metadata = JSON.parse(formData.get('metadata') || '{}');

                if (!file) {
                    return NextResponse.json(
                        { error: 'File is required' },
                        { status: 400 }
                    );
                }

                const buffer = Buffer.from(await file.arrayBuffer());

                const document = await documentsService.uploadDocument(
                    {
                        buffer,
                        originalFilename: file.name,
                        mimeType: file.type,
                        size: file.size,
                    },
                    metadata,
                    user,
                    { ipAddress: req.headers.get('x-forwarded-for') || 'unknown' }
                );

                return NextResponse.json(document, { status: 201 });
            } catch (error) {
                console.error('Upload document error:', error);
                return NextResponse.json(
                    { error: error.message || 'Failed to upload document' },
                    { status: 500 }
                );
            }
        })(req, user);
    })(request);
}
