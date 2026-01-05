/**
 * Card Component
 * Reusable card container with header, body, and footer
 */
export function Card({
    children,
    className = '',
    padding = 'md',
    ...props
}) {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={`bg-white rounded-xl shadow-sm border border-gray-200 ${paddingClasses[padding]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * CardHeader Component
 */
export function CardHeader({
    title,
    subtitle,
    action,
    className = '',
}) {
    return (
        <div className={`flex items-start justify-between mb-4 ${className}`}>
            <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {subtitle && (
                    <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

/**
 * CardBody Component
 */
export function CardBody({ children, className = '' }) {
    return (
        <div className={className}>
            {children}
        </div>
    );
}

/**
 * CardFooter Component
 */
export function CardFooter({ children, className = '' }) {
    return (
        <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
            {children}
        </div>
    );
}

/**
 * StatCard Component
 * For dashboard statistics
 */
export function StatCard({
    icon,
    label,
    value,
    change,
    changeType = 'neutral', // positive, negative, neutral
    footer,
    className = '',
}) {
    const changeColors = {
        positive: 'text-green-600',
        negative: 'text-red-600',
        neutral: 'text-gray-500',
    };

    return (
        <Card className={className}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm text-gray-500">{label}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
                {value}
            </div>
            {change && (
                <div className={`text-sm ${changeColors[changeType]}`}>
                    {change}
                </div>
            )}
            {footer && (
                <div className="text-sm text-gray-500 mt-2">
                    {footer}
                </div>
            )}
        </Card>
    );
}

export default Card;
