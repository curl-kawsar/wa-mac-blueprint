import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/modules/auth/auth.service';
import { roleHasPermission, ROLES } from '@/lib/rbac/roles';

/**
 * RBAC Middleware for API route protection
 * Provides authentication and authorization checks
 */

/**
 * Extract JWT token from request headers
 * 
 * @param {Request} request - Next.js request object
 * @returns {string|null} JWT token or null
 */
export function extractToken(request) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
        return null;
    }

    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    return null;
}

/**
 * Create an unauthorized response
 * 
 * @param {string} message - Error message
 * @returns {NextResponse} Unauthorized response
 */
function unauthorized(message = 'Unauthorized') {
    return NextResponse.json(
        { error: message, code: 'UNAUTHORIZED' },
        { status: 401 }
    );
}

/**
 * Create a forbidden response
 * 
 * @param {string} message - Error message
 * @returns {NextResponse} Forbidden response
 */
function forbidden(message = 'Forbidden') {
    return NextResponse.json(
        { error: message, code: 'FORBIDDEN' },
        { status: 403 }
    );
}

/**
 * Authenticate request and attach user to context
 * 
 * @param {Request} request - Next.js request object
 * @returns {Promise<{user: object}|NextResponse>} User object or error response
 */
export async function authenticate(request) {
    const token = extractToken(request);

    if (!token) {
        return { error: unauthorized('No token provided') };
    }

    try {
        const payload = await verifyAccessToken(token);

        if (!payload) {
            return { error: unauthorized('Invalid token') };
        }

        return { user: payload };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return { error: unauthorized('Token expired') };
        }
        return { error: unauthorized('Invalid token') };
    }
}

/**
 * Check if user has required permission
 * 
 * @param {object} user - User object from JWT
 * @param {string} permission - Required permission
 * @returns {boolean} Whether user has permission
 */
export function hasPermission(user, permission) {
    if (!user || !user.role) {
        return false;
    }

    return roleHasPermission(user.role, permission);
}

/**
 * Check if user has any of the required permissions
 * 
 * @param {object} user - User object from JWT
 * @param {string[]} permissions - Array of permissions (any match)
 * @returns {boolean} Whether user has any permission
 */
export function hasAnyPermission(user, permissions) {
    return permissions.some((perm) => hasPermission(user, perm));
}

/**
 * Check if user has all of the required permissions
 * 
 * @param {object} user - User object from JWT
 * @param {string[]} permissions - Array of permissions (all must match)
 * @returns {boolean} Whether user has all permissions
 */
export function hasAllPermissions(user, permissions) {
    return permissions.every((perm) => hasPermission(user, perm));
}

/**
 * Create a protected route handler
 * Wraps a handler with authentication and permission checks
 * 
 * @param {object} options - Protection options
 * @param {string|string[]} options.permissions - Required permission(s)
 * @param {boolean} options.requireAll - If true, require all permissions (default: false, any match)
 * @param {Function} handler - Route handler function
 * @returns {Function} Protected route handler
 * 
 * @example
 * export const GET = withAuth(
 *   { permissions: 'owners:read' },
 *   async (request, { user }) => {
 *     // Handler code
 *   }
 * );
 */
export function withAuth(options, handler) {
    return async (request, context) => {
        // Authenticate
        const authResult = await authenticate(request);

        if (authResult.error) {
            return authResult.error;
        }

        const user = authResult.user;

        // Check permissions if specified
        if (options.permissions) {
            const permissions = Array.isArray(options.permissions)
                ? options.permissions
                : [options.permissions];

            const hasRequired = options.requireAll
                ? hasAllPermissions(user, permissions)
                : hasAnyPermission(user, permissions);

            if (!hasRequired) {
                return forbidden('Insufficient permissions');
            }
        }

        // Call handler with user context
        return handler(request, { ...context, user });
    };
}

/**
 * Create a protected route handler that requires specific roles
 * 
 * @param {string|string[]} roles - Required role(s)
 * @param {Function} handler - Route handler function
 * @returns {Function} Protected route handler
 */
export function withRole(roles, handler) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return async (request, context) => {
        const authResult = await authenticate(request);

        if (authResult.error) {
            return authResult.error;
        }

        const user = authResult.user;

        if (!allowedRoles.includes(user.role)) {
            return forbidden('Role not authorized');
        }

        return handler(request, { ...context, user });
    };
}

/**
 * Resource-scoped access check
 * Ensures user can only access their own resources
 * 
 * @param {object} user - User object from JWT
 * @param {string} resourceOwnerId - ID of the resource owner
 * @returns {boolean} Whether user can access resource
 */
export function canAccessResource(user, resourceOwnerId) {
    // Super admin and admin can access all
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user.role)) {
        return true;
    }

    // Others can only access their own resources
    return user.id === resourceOwnerId || user.userId === resourceOwnerId;
}

/**
 * Owner-scoped access check
 * For owners accessing their own properties/data
 * 
 * @param {object} user - User object from JWT
 * @param {string} ownerId - Owner ID to check access for
 * @returns {boolean} Whether user can access owner's data
 */
export function canAccessOwnerData(user, ownerId) {
    // Admins can access all
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROPERTY_MANAGER, ROLES.ACCOUNTANT].includes(user.role)) {
        return true;
    }

    // Owners can only access their own data
    if (user.role === ROLES.OWNER) {
        return user.ownerId === ownerId;
    }

    return false;
}

/**
 * Tenant-scoped access check
 * For tenants accessing their own lease/data
 * 
 * @param {object} user - User object from JWT
 * @param {string} tenantId - Tenant ID to check access for
 * @returns {boolean} Whether user can access tenant's data
 */
export function canAccessTenantData(user, tenantId) {
    // Staff can access all
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROPERTY_MANAGER, ROLES.LEASING_AGENT].includes(user.role)) {
        return true;
    }

    // Tenants can only access their own data
    if (user.role === ROLES.TENANT) {
        return user.tenantId === tenantId;
    }

    return false;
}

export default {
    extractToken,
    authenticate,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    withAuth,
    withRole,
    canAccessResource,
    canAccessOwnerData,
    canAccessTenantData,
};
