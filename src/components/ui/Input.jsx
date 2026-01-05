/**
 * Input Component
 * Reusable form input with label, error state, and icons
 */
export function Input({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder,
    error,
    helper,
    disabled = false,
    required = false,
    icon,
    className = '',
    ...props
}) {
    return (
        <div className={className}>
            {label && (
                <label
                    htmlFor={name}
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </span>
                )}
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    className={`
            w-full px-4 py-2.5 rounded-lg border bg-white
            transition-colors focus:outline-none focus:ring-2
            ${icon ? 'pl-10' : ''}
            ${error
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                        }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}
            {helper && !error && (
                <p className="mt-1.5 text-sm text-gray-500">{helper}</p>
            )}
        </div>
    );
}

/**
 * TextArea Component
 */
export function TextArea({
    label,
    name,
    value,
    onChange,
    placeholder,
    error,
    rows = 4,
    disabled = false,
    required = false,
    className = '',
    ...props
}) {
    return (
        <div className={className}>
            {label && (
                <label
                    htmlFor={name}
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                rows={rows}
                className={`
          w-full px-4 py-2.5 rounded-lg border bg-white
          transition-colors focus:outline-none focus:ring-2
          ${error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    }
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}

/**
 * Select Component
 */
export function Select({
    label,
    name,
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    error,
    disabled = false,
    required = false,
    className = '',
    ...props
}) {
    return (
        <div className={className}>
            {label && (
                <label
                    htmlFor={name}
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                required={required}
                className={`
          w-full px-4 py-2.5 rounded-lg border bg-white
          transition-colors focus:outline-none focus:ring-2
          ${error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    }
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
        `}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}

/**
 * Checkbox Component
 */
export function Checkbox({
    label,
    name,
    checked,
    onChange,
    disabled = false,
    className = '',
}) {
    return (
        <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );
}

export default Input;
