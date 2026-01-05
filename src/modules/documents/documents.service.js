import { connectDB } from '@/lib/db/mongoose';
import { getDocumentModel } from './documents.model';
import * as localAdapter from './storage/local.adapter';
import { logAction } from '@/lib/audit/audit.service';

/**
 * Documents Service
 * Handles document upload, storage, and retrieval with visibility rules
 */

/**
 * Get the storage adapter based on configuration
 */
function getStorageAdapter() {
    // For now, always use local adapter
    // In production, check env and return appropriate adapter
    return localAdapter;
}

/**
 * Upload a document
 * 
 * @param {object} file - File object { buffer, originalFilename, mimeType, size }
 * @param {object} metadata - Document metadata
 * @param {object} actor - User uploading
 * @param {object} context - Request context
 * @returns {Promise<object>} Created document
 */
export async function uploadDocument(file, metadata, actor, context = {}) {
    await connectDB();
    const Document = getDocumentModel();
    const adapter = getStorageAdapter();

    // Upload to storage
    const storageInfo = await adapter.upload(
        file.buffer,
        file.originalFilename,
        { mimeType: file.mimeType }
    );

    // Create document record
    const document = new Document({
        name: metadata.name || file.originalFilename,
        originalFilename: file.originalFilename,
        mimeType: file.mimeType,
        size: file.size,
        category: metadata.category || 'other',
        storage: {
            adapter: storageInfo.adapter,
            path: storageInfo.path,
            bucket: storageInfo.bucket,
            key: storageInfo.key,
        },
        owner: metadata.ownerId,
        tenant: metadata.tenantId,
        property: metadata.propertyId,
        unit: metadata.unitId,
        lease: metadata.leaseId,
        maintenanceRequest: metadata.maintenanceRequestId,
        visibility: metadata.visibility || {
            allowedRoles: ['super_admin', 'admin', 'property_manager'],
            isPublicToOwner: false,
            isPublicToTenant: false,
        },
        description: metadata.description,
        tags: metadata.tags,
        expiresAt: metadata.expiresAt,
        uploadedBy: actor.id,
    });

    await document.save();

    await logAction(
        'document.uploaded',
        actor,
        { type: 'document', id: document._id, name: document.name },
        { after: { category: document.category, size: document.size } },
        context
    );

    return document.toJSON();
}

/**
 * Get document by ID
 */
export async function getDocumentById(documentId, actor) {
    await connectDB();
    const Document = getDocumentModel();

    const document = await Document.findById(documentId).lean();

    if (!document) {
        throw new Error('Document not found');
    }

    // Check visibility
    if (!canAccessDocument(document, actor)) {
        throw new Error('Access denied');
    }

    return document;
}

/**
 * Check if user can access document
 */
function canAccessDocument(document, user) {
    // Super admin and admin can access all
    if (['super_admin', 'admin'].includes(user.role)) {
        return true;
    }

    // Check allowed roles
    if (document.visibility.allowedRoles?.includes(user.role)) {
        return true;
    }

    // Check specific allowed users
    if (document.visibility.allowedUsers?.some((id) => id.toString() === user.id)) {
        return true;
    }

    // Check owner access
    if (user.role === 'owner' && document.visibility.isPublicToOwner) {
        if (document.owner?.toString() === user.ownerId) {
            return true;
        }
    }

    // Check tenant access
    if (user.role === 'tenant' && document.visibility.isPublicToTenant) {
        if (document.tenant?.toString() === user.tenantId) {
            return true;
        }
    }

    return false;
}

/**
 * Download document content
 */
export async function downloadDocument(documentId, actor, context = {}) {
    await connectDB();
    const Document = getDocumentModel();
    const adapter = getStorageAdapter();

    const document = await Document.findById(documentId);

    if (!document) {
        throw new Error('Document not found');
    }

    // Check visibility
    if (!canAccessDocument(document, actor)) {
        throw new Error('Access denied');
    }

    // Get file content
    const fileBuffer = await adapter.download(document.storage.path);

    // Log access
    document.accessLog.push({
        user: actor.id,
        accessedAt: new Date(),
        action: 'download',
    });

    // Keep only last 10 accesses
    if (document.accessLog.length > 10) {
        document.accessLog = document.accessLog.slice(-10);
    }

    await document.save();

    await logAction(
        'document.accessed',
        actor,
        { type: 'document', id: document._id, name: document.name },
        { metadata: { action: 'download' } },
        context
    );

    return {
        buffer: fileBuffer,
        filename: document.originalFilename,
        mimeType: document.mimeType,
        size: document.size,
    };
}

/**
 * List documents with filters
 */
export async function listDocuments(filters = {}, options = {}, actor) {
    await connectDB();
    const Document = getDocumentModel();

    const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = options;

    const query = { status: 'active' };

    if (filters.category) {
        query.category = filters.category;
    }

    if (filters.ownerId) {
        query.owner = filters.ownerId;
    }

    if (filters.tenantId) {
        query.tenant = filters.tenantId;
    }

    if (filters.propertyId) {
        query.property = filters.propertyId;
    }

    if (filters.leaseId) {
        query.lease = filters.leaseId;
    }

    // Apply visibility filter based on user role
    if (!['super_admin', 'admin'].includes(actor.role)) {
        query.$or = [
            { 'visibility.allowedRoles': actor.role },
            { 'visibility.allowedUsers': actor.id },
        ];

        if (actor.role === 'owner' && actor.ownerId) {
            query.$or.push({
                owner: actor.ownerId,
                'visibility.isPublicToOwner': true,
            });
        }

        if (actor.role === 'tenant' && actor.tenantId) {
            query.$or.push({
                tenant: actor.tenantId,
                'visibility.isPublicToTenant': true,
            });
        }
    }

    const [documents, total] = await Promise.all([
        Document.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Document.countDocuments(query),
    ]);

    return {
        data: documents,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
}

/**
 * Update document metadata
 */
export async function updateDocument(documentId, updates, actor) {
    await connectDB();
    const Document = getDocumentModel();

    const document = await Document.findById(documentId);

    if (!document) {
        throw new Error('Document not found');
    }

    // Only allow updating certain fields
    const allowedUpdates = [
        'name',
        'category',
        'description',
        'tags',
        'visibility',
        'expiresAt',
    ];

    for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
            document[key] = updates[key];
        }
    }

    await document.save();

    return document.toJSON();
}

/**
 * Delete document (soft delete)
 */
export async function deleteDocument(documentId, actor, context = {}) {
    await connectDB();
    const Document = getDocumentModel();

    const document = await Document.findByIdAndUpdate(
        documentId,
        { status: 'deleted' },
        { new: true }
    );

    if (!document) {
        throw new Error('Document not found');
    }

    await logAction(
        'document.deleted',
        actor,
        { type: 'document', id: document._id, name: document.name },
        {},
        context
    );

    return document;
}

/**
 * Archive document
 */
export async function archiveDocument(documentId, actor) {
    await connectDB();
    const Document = getDocumentModel();

    const document = await Document.findByIdAndUpdate(
        documentId,
        { status: 'archived' },
        { new: true }
    );

    if (!document) {
        throw new Error('Document not found');
    }

    return document;
}

export default {
    uploadDocument,
    getDocumentById,
    downloadDocument,
    listDocuments,
    updateDocument,
    deleteDocument,
    archiveDocument,
};
