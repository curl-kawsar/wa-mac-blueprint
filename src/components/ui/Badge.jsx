/**
 * Badge Component
 * Status badges and labels
 */
export function Badge({
    children,
    variant = 'default',
    size = 'md',
    className = '',
}) {
    const variants = {
        default: 'bg-gray-100 text-gray-700',
        primary: 'bg-blue-100 text-blue-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-cyan-100 text-cyan-700',
        purple: 'bg-purple-100 text-purple-700',
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1 text-sm',
    };

    return (
        <span
            className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {children}
        </span>
    );
}

/**
 * StatusBadge - Predefined status badges
 */
export function StatusBadge({ status, className = '' }) {
    const statusMap = {
        // General
        active: { label: 'Active', variant: 'success' },
        inactive: { label: 'Inactive', variant: 'default' },
        pending: { label: 'Pending', variant: 'warning' },

        // Applications
        draft: { label: 'Draft', variant: 'default' },
        submitted: { label: 'Submitted', variant: 'info' },
        screening: { label: 'Screening', variant: 'purple' },
        approved: { label: 'Approved', variant: 'success' },
        denied: { label: 'Denied', variant: 'danger' },

        // Leases
        expired: { label: 'Expired', variant: 'default' },
        terminated: { label: 'Terminated', variant: 'danger' },

        // Units
        vacant: { label: 'Vacant', variant: 'warning' },
        occupied: { label: 'Occupied', variant: 'success' },
        maintenance: { label: 'Maintenance', variant: 'purple' },

        // Payments
        paid: { label: 'Paid', variant: 'success' },
        overdue: { label: 'Overdue', variant: 'danger' },
        partially_paid: { label: 'Partial', variant: 'warning' },

        // Maintenance
        open: { label: 'Open', variant: 'danger' },
        in_progress: { label: 'In Progress', variant: 'warning' },
        completed: { label: 'Completed', variant: 'success' },

        // Payouts
        processing: { label: 'Processing', variant: 'info' },
        failed: { label: 'Failed', variant: 'danger' },
    };

    const config = statusMap[status] || { label: status, variant: 'default' };

    return (
        <Badge variant={config.variant} className={className}>
            {config.label}
        </Badge>
    );
}

export default Badge;
