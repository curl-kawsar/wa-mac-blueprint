'use client';

/**
 * Table Component
 * Reusable data table with pagination
 */
export function Table({
    columns,
    data,
    loading = false,
    emptyMessage = 'No data available',
    onRowClick,
    className = '',
}) {
    if (loading) {
        return (
            <div className={`bg-white rounded-xl border border-gray-200 p-8 ${className}`}>
                <div className="flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className={`bg-white rounded-xl border border-gray-200 p-8 ${className}`}>
                <p className="text-center text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            {columns.map((col, i) => (
                                <th
                                    key={i}
                                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                    style={{ width: col.width }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row, rowIndex) => (
                            <tr
                                key={row.id || rowIndex}
                                className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={() => onRowClick?.(row)}
                            >
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4 text-sm text-gray-900">
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Pagination Component
 */
export function Pagination({
    page,
    totalPages,
    onPageChange,
    className = '',
}) {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return (
        <div className={`flex items-center justify-between ${className}`}>
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous
            </button>

            <div className="flex items-center gap-1">
                {start > 1 && (
                    <>
                        <button
                            onClick={() => onPageChange(1)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            1
                        </button>
                        {start > 2 && <span className="px-2 text-gray-400">...</span>}
                    </>
                )}

                {pages.map((p) => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg ${p === page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {p}
                    </button>
                ))}

                {end < totalPages && (
                    <>
                        {end < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
                        <button
                            onClick={() => onPageChange(totalPages)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            {totalPages}
                        </button>
                    </>
                )}
            </div>

            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next
            </button>
        </div>
    );
}

export default Table;
