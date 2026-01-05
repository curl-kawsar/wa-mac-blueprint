'use client';

import { useEffect, useState } from 'react';

export default function TenantDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulated data
        setData({
            unit: 'Sunset Apartments #101',
            rent: 1800,
            dueDate: 'January 1, 2025',
            leaseEnd: 'January 31, 2025',
            balance: 0,
            nextPayment: 1800,
        });
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome Home</h1>
                <p className="text-gray-600">{data.unit}</p>
            </div>

            {/* Payment Alert */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold mb-1">Next Payment Due</h2>
                        <p className="text-3xl font-bold">${data.nextPayment.toLocaleString()}</p>
                        <p className="text-emerald-100 mt-1">Due on {data.dueDate}</p>
                    </div>
                    <button className="bg-white text-emerald-600 font-semibold px-6 py-3 rounded-lg hover:bg-emerald-50 transition-colors">
                        Pay Now
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Balance */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">💰</span>
                        <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${data.balance === 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                            {data.balance === 0 ? 'Paid' : 'Balance Due'}
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        ${data.balance.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-500">Current Balance</p>
                </div>

                {/* Monthly Rent */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">📄</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        ${data.rent.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-500">Monthly Rent</p>
                </div>

                {/* Lease Status */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">📅</span>
                        <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Expiring Soon
                        </span>
                    </div>
                    <div className="text-xl font-bold text-gray-900 mb-1">
                        {data.leaseEnd}
                    </div>
                    <p className="text-sm text-gray-500">Lease Ends</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Pay Rent', icon: '💳', href: '/tenant/payments', color: 'emerald' },
                        { label: 'Submit Request', icon: '🔧', href: '/tenant/maintenance/new', color: 'amber' },
                        { label: 'View Lease', icon: '📄', href: '/tenant/lease', color: 'blue' },
                        { label: 'Contact Us', icon: '💬', href: '/tenant/messages', color: 'purple' },
                    ].map((action, i) => (
                        <a
                            key={i}
                            href={action.href}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-${action.color}-500 hover:bg-${action.color}-50 transition-colors`}
                        >
                            <span className="text-2xl">{action.icon}</span>
                            <span className="text-sm font-medium text-gray-700">{action.label}</span>
                        </a>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Payments */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Payment History</h3>
                    <div className="space-y-3">
                        {[
                            { date: 'Dec 1, 2024', amount: 1800, status: 'Paid', method: 'Auto-pay' },
                            { date: 'Nov 1, 2024', amount: 1800, status: 'Paid', method: 'Auto-pay' },
                            { date: 'Oct 1, 2024', amount: 1800, status: 'Paid', method: 'Manual' },
                        ].map((payment, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                <div>
                                    <p className="font-medium text-gray-900">{payment.date}</p>
                                    <p className="text-sm text-gray-500">{payment.method}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">${payment.amount.toLocaleString()}</p>
                                    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                                        {payment.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <a href="/tenant/payments" className="block mt-4 text-center text-emerald-600 font-medium hover:text-emerald-700">
                        View All Payments →
                    </a>
                </div>

                {/* Maintenance Requests */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Maintenance Requests</h3>
                    <div className="space-y-3">
                        {[
                            { title: 'Leaky faucet in kitchen', status: 'Completed', date: 'Dec 10, 2024' },
                            { title: 'Replace smoke detector battery', status: 'Scheduled', date: 'Dec 20, 2024' },
                        ].map((request, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                <div>
                                    <p className="font-medium text-gray-900">{request.title}</p>
                                    <p className="text-sm text-gray-500">{request.date}</p>
                                </div>
                                <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${request.status === 'Completed'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {request.status}
                                </span>
                            </div>
                        ))}
                    </div>
                    <a href="/tenant/maintenance" className="block mt-4 text-center text-emerald-600 font-medium hover:text-emerald-700">
                        View All Requests →
                    </a>
                </div>
            </div>

            {/* Announcements */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Announcements</h3>
                <div className="space-y-4">
                    {[
                        {
                            title: 'Holiday Office Hours',
                            content: 'The management office will be closed Dec 24-26 for the holidays.',
                            date: 'Dec 20, 2024',
                            type: 'info',
                        },
                        {
                            title: 'Water Shutoff Notice',
                            content: 'Scheduled maintenance on Dec 22, 9am-12pm. Water will be temporarily shut off.',
                            date: 'Dec 18, 2024',
                            type: 'warning',
                        },
                    ].map((announcement, i) => (
                        <div
                            key={i}
                            className={`p-4 rounded-lg border-l-4 ${announcement.type === 'warning'
                                    ? 'bg-amber-50 border-amber-500'
                                    : 'bg-blue-50 border-blue-500'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                                <span className="text-xs text-gray-500">{announcement.date}</span>
                            </div>
                            <p className="text-sm text-gray-600">{announcement.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
