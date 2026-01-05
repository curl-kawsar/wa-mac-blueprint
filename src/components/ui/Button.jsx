/**
 * Button Component
 * Reusable button with multiple variants and sizes
 */
export function Button({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    className = '',
    onClick,
    ...props
}) {
    const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
        success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
        outline: 'border-2 border-gray-300 hover:border-gray-400 bg-transparent text-gray-700 focus:ring-gray-500',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        xl: 'px-8 py-4 text-lg',
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {loading && (
                <span className="mr-2 animate-spin">⏳</span>
            )}
            {children}
        </button>
    );
}

/**
 * IconButton Component
 */
export function IconButton({
    icon,
    variant = 'ghost',
    size = 'md',
    className = '',
    ...props
}) {
    const sizes = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
    };

    return (
        <Button
            variant={variant}
            className={`!p-0 ${sizes[size]} ${className}`}
            {...props}
        >
            {icon}
        </Button>
    );
}

export default Button;
