import { ROLES, roleHasPermission, canManageRole } from '@/lib/rbac/roles';

/**
 * Auth Policy Engine
 * Defines authorization rules for auth-related operations
 */

/**
 * Check if user can create another user with the given role
 * 
 * @param {object} actor - User performing the action
 * @param {string} targetRole - Role of the user being created
 * @returns {boolean} Whether action is allowed
 */
export function canCreateUserWithRole(actor, targetRole) {
    // Only admins can create users
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(actor.role)) {
        return false;
    }

    // Can't create users with higher or equal role (except super admin)
    if (actor.role === ROLES.SUPER_ADMIN) {
        return true;
    }

    return canManageRole(actor.role, targetRole);
}

/**
 * Check if user can view another user
 * 
 * @param {object} actor - User performing the action
 * @param {object} target - User being viewed
 * @returns {boolean} Whether action is allowed
 */
export function canViewUser(actor, target) {
    // Users can always view themselves
    if (actor.id === target._id?.toString() || actor.id === target.id) {
        return true;
    }

    // Admins can view all users
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(actor.role)) {
        return true;
    }

    // Property managers can view their tenants and staff
    if (actor.role === ROLES.PROPERTY_MANAGER) {
        return [
            ROLES.TENANT,
            ROLES.MAINTENANCE_STAFF,
            ROLES.LEASING_AGENT,
        ].includes(target.role);
    }

    return false;
}

/**
 * Check if user can update another user
 * 
 * @param {object} actor - User performing the action
 * @param {object} target - User being updated
 * @returns {boolean} Whether action is allowed
 */
export function canUpdateUser(actor, target) {
    // Users can update their own profile (limited fields)
    if (actor.id === target._id?.toString() || actor.id === target.id) {
        return true;
    }

    // Only admins can update other users
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(actor.role)) {
        return false;
    }

    // Can't update users with higher or equal role (except super admin)
    if (actor.role === ROLES.SUPER_ADMIN) {
        return true;
    }

    return canManageRole(actor.role, target.role);
}

/**
 * Check if user can change another user's role
 * 
 * @param {object} actor - User performing the action
 * @param {object} target - User whose role is being changed
 * @param {string} newRole - New role being assigned
 * @returns {boolean} Whether action is allowed
 */
export function canChangeUserRole(actor, target, newRole) {
    // Can't change own role
    if (actor.id === target._id?.toString() || actor.id === target.id) {
        return false;
    }

    // Only super admin and admin can change roles
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(actor.role)) {
        return false;
    }

    // Super admin can do anything
    if (actor.role === ROLES.SUPER_ADMIN) {
        return true;
    }

    // Admin can only manage lower roles and assign lower roles
    return canManageRole(actor.role, target.role) && canManageRole(actor.role, newRole);
}

/**
 * Check if user can delete another user
 * 
 * @param {object} actor - User performing the action
 * @param {object} target - User being deleted
 * @returns {boolean} Whether action is allowed
 */
export function canDeleteUser(actor, target) {
    // Can't delete self
    if (actor.id === target._id?.toString() || actor.id === target.id) {
        return false;
    }

    // Only super admin can delete users
    if (actor.role !== ROLES.SUPER_ADMIN) {
        return false;
    }

    return true;
}

/**
 * Check if user can suspend/unsuspend another user
 * 
 * @param {object} actor - User performing the action
 * @param {object} target - User being suspended
 * @returns {boolean} Whether action is allowed
 */
export function canSuspendUser(actor, target) {
    // Can't suspend self
    if (actor.id === target._id?.toString() || actor.id === target.id) {
        return false;
    }

    // Only admins can suspend
    if (![ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(actor.role)) {
        return false;
    }

    // Super admin can suspend anyone
    if (actor.role === ROLES.SUPER_ADMIN) {
        return true;
    }

    // Admin can only suspend lower roles
    return canManageRole(actor.role, target.role);
}

/**
 * Check if user can view audit logs
 * 
 * @param {object} actor - User requesting audit logs
 * @returns {boolean} Whether action is allowed
 */
export function canViewAuditLogs(actor) {
    return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(actor.role);
}

/**
 * Get allowed fields for user update based on actor role
 * 
 * @param {object} actor - User performing the action
 * @param {object} target - User being updated
 * @returns {string[]} Allowed field names
 */
export function getAllowedUpdateFields(actor, target) {
    const isSelf = actor.id === target._id?.toString() || actor.id === target.id;

    // Self-update: limited fields
    if (isSelf) {
        return ['firstName', 'lastName', 'phone'];
    }

    // Admin update: more fields
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(actor.role)) {
        return [
            'firstName',
            'lastName',
            'phone',
            'status',
            'role',
            'ownerId',
            'tenantId',
        ];
    }

    return [];
}

export default {
    canCreateUserWithRole,
    canViewUser,
    canUpdateUser,
    canChangeUserRole,
    canDeleteUser,
    canSuspendUser,
    canViewAuditLogs,
    getAllowedUpdateFields,
};
