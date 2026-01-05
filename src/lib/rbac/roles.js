/**
 * Role definitions with hierarchical permissions
 * Each role has a list of permissions it can perform
 */

export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    PROPERTY_MANAGER: 'property_manager',
    LEASING_AGENT: 'leasing_agent',
    MAINTENANCE_STAFF: 'maintenance_staff',
    ACCOUNTANT: 'accountant',
    OWNER: 'owner',
    TENANT: 'tenant',
};

/**
 * Permission definitions
 * Format: resource:action
 */
export const PERMISSIONS = {
    // Users
    USERS_CREATE: 'users:create',
    USERS_READ: 'users:read',
    USERS_UPDATE: 'users:update',
    USERS_DELETE: 'users:delete',
    USERS_MANAGE_ROLES: 'users:manage_roles',

    // Owners
    OWNERS_CREATE: 'owners:create',
    OWNERS_READ: 'owners:read',
    OWNERS_UPDATE: 'owners:update',
    OWNERS_DELETE: 'owners:delete',
    OWNERS_READ_SENSITIVE: 'owners:read_sensitive',

    // Properties
    PROPERTIES_CREATE: 'properties:create',
    PROPERTIES_READ: 'properties:read',
    PROPERTIES_UPDATE: 'properties:update',
    PROPERTIES_DELETE: 'properties:delete',
    PROPERTIES_ASSIGN: 'properties:assign',
    PROPERTIES_NOTES: 'properties:notes',

    // Units
    UNITS_CREATE: 'units:create',
    UNITS_READ: 'units:read',
    UNITS_UPDATE: 'units:update',
    UNITS_DELETE: 'units:delete',

    // Tenants
    TENANTS_CREATE: 'tenants:create',
    TENANTS_READ: 'tenants:read',
    TENANTS_UPDATE: 'tenants:update',
    TENANTS_DELETE: 'tenants:delete',
    TENANTS_SCREEN: 'tenants:screen',
    TENANTS_APPROVE: 'tenants:approve',

    // Leases
    LEASES_CREATE: 'leases:create',
    LEASES_READ: 'leases:read',
    LEASES_UPDATE: 'leases:update',
    LEASES_DELETE: 'leases:delete',
    LEASES_TERMINATE: 'leases:terminate',

    // Billing
    BILLING_CREATE: 'billing:create',
    BILLING_READ: 'billing:read',
    BILLING_UPDATE: 'billing:update',
    BILLING_PROCESS: 'billing:process',

    // Ledger
    LEDGER_CREATE: 'ledger:create',
    LEDGER_READ: 'ledger:read',
    LEDGER_ADMIN: 'ledger:admin',

    // Payouts
    PAYOUTS_CREATE: 'payouts:create',
    PAYOUTS_READ: 'payouts:read',
    PAYOUTS_PROCESS: 'payouts:process',
    PAYOUTS_APPROVE: 'payouts:approve',

    // Statements
    STATEMENTS_CREATE: 'statements:create',
    STATEMENTS_READ: 'statements:read',

    // Maintenance
    MAINTENANCE_CREATE: 'maintenance:create',
    MAINTENANCE_READ: 'maintenance:read',
    MAINTENANCE_UPDATE: 'maintenance:update',
    MAINTENANCE_ASSIGN: 'maintenance:assign',
    MAINTENANCE_COMPLETE: 'maintenance:complete',

    // Communications
    COMMS_CREATE: 'communications:create',
    COMMS_READ: 'communications:read',
    COMMS_UPDATE: 'communications:update',
    COMMS_DELETE: 'communications:delete',
    COMMS_BROADCAST: 'communications:broadcast',

    // Documents
    DOCUMENTS_CREATE: 'documents:create',
    DOCUMENTS_READ: 'documents:read',
    DOCUMENTS_UPDATE: 'documents:update',
    DOCUMENTS_DELETE: 'documents:delete',
    DOCUMENTS_ADMIN: 'documents:admin',

    // Audit
    AUDIT_READ: 'audit:read',

    // System
    SYSTEM_ADMIN: 'system:admin',
};

/**
 * Role to permissions mapping
 * Defines what each role can do
 */
export const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: [
        // Super admin has all permissions
        ...Object.values(PERMISSIONS),
    ],

    [ROLES.ADMIN]: [
        // Users (all except delete)
        PERMISSIONS.USERS_CREATE,
        PERMISSIONS.USERS_READ,
        PERMISSIONS.USERS_UPDATE,
        PERMISSIONS.USERS_MANAGE_ROLES,

        // Owners (full access)
        PERMISSIONS.OWNERS_CREATE,
        PERMISSIONS.OWNERS_READ,
        PERMISSIONS.OWNERS_UPDATE,
        PERMISSIONS.OWNERS_DELETE,
        PERMISSIONS.OWNERS_READ_SENSITIVE,

        // Properties (full access)
        PERMISSIONS.PROPERTIES_CREATE,
        PERMISSIONS.PROPERTIES_READ,
        PERMISSIONS.PROPERTIES_UPDATE,
        PERMISSIONS.PROPERTIES_DELETE,
        PERMISSIONS.PROPERTIES_ASSIGN,
        PERMISSIONS.PROPERTIES_NOTES,

        // Units (full access)
        PERMISSIONS.UNITS_CREATE,
        PERMISSIONS.UNITS_READ,
        PERMISSIONS.UNITS_UPDATE,
        PERMISSIONS.UNITS_DELETE,

        // Tenants (full access)
        PERMISSIONS.TENANTS_CREATE,
        PERMISSIONS.TENANTS_READ,
        PERMISSIONS.TENANTS_UPDATE,
        PERMISSIONS.TENANTS_DELETE,
        PERMISSIONS.TENANTS_SCREEN,
        PERMISSIONS.TENANTS_APPROVE,

        // Leases (full access)
        PERMISSIONS.LEASES_CREATE,
        PERMISSIONS.LEASES_READ,
        PERMISSIONS.LEASES_UPDATE,
        PERMISSIONS.LEASES_DELETE,
        PERMISSIONS.LEASES_TERMINATE,

        // Billing (full access)
        PERMISSIONS.BILLING_CREATE,
        PERMISSIONS.BILLING_READ,
        PERMISSIONS.BILLING_UPDATE,
        PERMISSIONS.BILLING_PROCESS,

        // Ledger
        PERMISSIONS.LEDGER_CREATE,
        PERMISSIONS.LEDGER_READ,
        PERMISSIONS.LEDGER_ADMIN,

        // Payouts
        PERMISSIONS.PAYOUTS_CREATE,
        PERMISSIONS.PAYOUTS_READ,
        PERMISSIONS.PAYOUTS_PROCESS,
        PERMISSIONS.PAYOUTS_APPROVE,

        // Statements
        PERMISSIONS.STATEMENTS_CREATE,
        PERMISSIONS.STATEMENTS_READ,

        // Maintenance
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_ASSIGN,
        PERMISSIONS.MAINTENANCE_COMPLETE,

        // Communications
        PERMISSIONS.COMMS_CREATE,
        PERMISSIONS.COMMS_READ,
        PERMISSIONS.COMMS_UPDATE,
        PERMISSIONS.COMMS_DELETE,
        PERMISSIONS.COMMS_BROADCAST,

        // Documents
        PERMISSIONS.DOCUMENTS_CREATE,
        PERMISSIONS.DOCUMENTS_READ,
        PERMISSIONS.DOCUMENTS_UPDATE,
        PERMISSIONS.DOCUMENTS_DELETE,
        PERMISSIONS.DOCUMENTS_ADMIN,

        // Audit
        PERMISSIONS.AUDIT_READ,
    ],

    [ROLES.PROPERTY_MANAGER]: [
        // Properties (read, update)
        PERMISSIONS.PROPERTIES_READ,
        PERMISSIONS.PROPERTIES_UPDATE,
        PERMISSIONS.PROPERTIES_NOTES,

        // Units
        PERMISSIONS.UNITS_READ,
        PERMISSIONS.UNITS_UPDATE,

        // Tenants (full access except delete)
        PERMISSIONS.TENANTS_CREATE,
        PERMISSIONS.TENANTS_READ,
        PERMISSIONS.TENANTS_UPDATE,
        PERMISSIONS.TENANTS_SCREEN,
        PERMISSIONS.TENANTS_APPROVE,

        // Leases (full access except delete)
        PERMISSIONS.LEASES_CREATE,
        PERMISSIONS.LEASES_READ,
        PERMISSIONS.LEASES_UPDATE,
        PERMISSIONS.LEASES_TERMINATE,

        // Billing (read, create)
        PERMISSIONS.BILLING_CREATE,
        PERMISSIONS.BILLING_READ,

        // Ledger (read only)
        PERMISSIONS.LEDGER_READ,

        // Maintenance
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_ASSIGN,
        PERMISSIONS.MAINTENANCE_COMPLETE,

        // Communications
        PERMISSIONS.COMMS_CREATE,
        PERMISSIONS.COMMS_READ,
        PERMISSIONS.COMMS_UPDATE,

        // Documents
        PERMISSIONS.DOCUMENTS_CREATE,
        PERMISSIONS.DOCUMENTS_READ,
        PERMISSIONS.DOCUMENTS_UPDATE,
    ],

    [ROLES.LEASING_AGENT]: [
        // Properties (read only)
        PERMISSIONS.PROPERTIES_READ,

        // Units (read only)
        PERMISSIONS.UNITS_READ,

        // Tenants (create, read, update, screen)
        PERMISSIONS.TENANTS_CREATE,
        PERMISSIONS.TENANTS_READ,
        PERMISSIONS.TENANTS_UPDATE,
        PERMISSIONS.TENANTS_SCREEN,

        // Leases (create, read)
        PERMISSIONS.LEASES_CREATE,
        PERMISSIONS.LEASES_READ,

        // Communications
        PERMISSIONS.COMMS_CREATE,
        PERMISSIONS.COMMS_READ,

        // Documents (create, read)
        PERMISSIONS.DOCUMENTS_CREATE,
        PERMISSIONS.DOCUMENTS_READ,
    ],

    [ROLES.MAINTENANCE_STAFF]: [
        // Properties (read only)
        PERMISSIONS.PROPERTIES_READ,

        // Units (read only)
        PERMISSIONS.UNITS_READ,

        // Maintenance (read, update, complete)
        PERMISSIONS.MAINTENANCE_READ,
        PERMISSIONS.MAINTENANCE_UPDATE,
        PERMISSIONS.MAINTENANCE_COMPLETE,

        // Communications (limited)
        PERMISSIONS.COMMS_CREATE,
        PERMISSIONS.COMMS_READ,
    ],

    [ROLES.ACCOUNTANT]: [
        // Owners (read, no sensitive)
        PERMISSIONS.OWNERS_READ,

        // Properties (read only)
        PERMISSIONS.PROPERTIES_READ,

        // Tenants (read only)
        PERMISSIONS.TENANTS_READ,

        // Leases (read only)
        PERMISSIONS.LEASES_READ,

        // Billing (full access)
        PERMISSIONS.BILLING_CREATE,
        PERMISSIONS.BILLING_READ,
        PERMISSIONS.BILLING_UPDATE,
        PERMISSIONS.BILLING_PROCESS,

        // Ledger (create, read)
        PERMISSIONS.LEDGER_CREATE,
        PERMISSIONS.LEDGER_READ,

        // Payouts
        PERMISSIONS.PAYOUTS_CREATE,
        PERMISSIONS.PAYOUTS_READ,
        PERMISSIONS.PAYOUTS_PROCESS,

        // Statements
        PERMISSIONS.STATEMENTS_CREATE,
        PERMISSIONS.STATEMENTS_READ,

        // Documents (read only)
        PERMISSIONS.DOCUMENTS_READ,
    ],

    [ROLES.OWNER]: [
        // Properties (read only, scoped to own properties)
        PERMISSIONS.PROPERTIES_READ,

        // Units (read only, scoped)
        PERMISSIONS.UNITS_READ,

        // Payouts (read only, scoped)
        PERMISSIONS.PAYOUTS_READ,

        // Statements (read only, scoped)
        PERMISSIONS.STATEMENTS_READ,

        // Documents (read only, scoped)
        PERMISSIONS.DOCUMENTS_READ,

        // Communications (own only)
        PERMISSIONS.COMMS_CREATE,
        PERMISSIONS.COMMS_READ,
    ],

    [ROLES.TENANT]: [
        // Leases (read only, own lease)
        PERMISSIONS.LEASES_READ,

        // Billing (read own)
        PERMISSIONS.BILLING_READ,

        // Maintenance (create, read own)
        PERMISSIONS.MAINTENANCE_CREATE,
        PERMISSIONS.MAINTENANCE_READ,

        // Communications (own only)
        PERMISSIONS.COMMS_CREATE,
        PERMISSIONS.COMMS_READ,

        // Documents (read own)
        PERMISSIONS.DOCUMENTS_READ,
    ],
};

/**
 * Get permissions for a role
 * 
 * @param {string} role - Role name
 * @returns {string[]} Array of permission strings
 */
export function getPermissionsForRole(role) {
    return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 * 
 * @param {string} role - Role name
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether role has permission
 */
export function roleHasPermission(role, permission) {
    const permissions = getPermissionsForRole(role);
    return permissions.includes(permission);
}

/**
 * Get all roles that have a specific permission
 * 
 * @param {string} permission - Permission to check
 * @returns {string[]} Array of role names
 */
export function getRolesWithPermission(permission) {
    return Object.entries(ROLE_PERMISSIONS)
        .filter(([, perms]) => perms.includes(permission))
        .map(([role]) => role);
}

/**
 * Check if role is at least as powerful as another role
 * Uses a simple hierarchy for comparison
 */
const ROLE_HIERARCHY = {
    [ROLES.SUPER_ADMIN]: 100,
    [ROLES.ADMIN]: 90,
    [ROLES.PROPERTY_MANAGER]: 70,
    [ROLES.ACCOUNTANT]: 60,
    [ROLES.LEASING_AGENT]: 50,
    [ROLES.MAINTENANCE_STAFF]: 40,
    [ROLES.OWNER]: 20,
    [ROLES.TENANT]: 10,
};

/**
 * Compare two roles in hierarchy
 * 
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {number} Positive if role1 > role2, negative if role1 < role2, 0 if equal
 */
export function compareRoles(role1, role2) {
    const level1 = ROLE_HIERARCHY[role1] || 0;
    const level2 = ROLE_HIERARCHY[role2] || 0;
    return level1 - level2;
}

/**
 * Check if role can manage another role
 * 
 * @param {string} managerRole - Role of the manager
 * @param {string} targetRole - Role being managed
 * @returns {boolean} Whether manager can manage target
 */
export function canManageRole(managerRole, targetRole) {
    return compareRoles(managerRole, targetRole) > 0;
}

export default {
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    getPermissionsForRole,
    roleHasPermission,
    getRolesWithPermission,
    compareRoles,
    canManageRole,
};
