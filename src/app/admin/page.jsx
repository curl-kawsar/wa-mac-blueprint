'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulated stats for now
        setStats({
            properties: { total: 12, active: 10, inactive: 2 },
            units: { total: 48, occupied: 42, vacant: 6, occupancyRate: 87.5 },
            tenants: { total: 42, active: 40, moveOuts: 2 },
            financials: {
                monthlyRent: 75600,
                collected: 68400,
                pending: 7200,
                collectionRate: 90.5
            },
            maintenance: { open: 5, inProgress: 3, completed: 127 },
        });
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening with your properties.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Properties */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">🏢</span>
                        <span className="text-sm text-gray-500">Properties</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.properties.total}
                    </div>
                    <div className="text-sm text-gray-500">
                        <span className="text-green-600">{stats.properties.active} active</span>
                        {' · '}
                        <span className="text-gray-400">{stats.properties.inactive} inactive</span>
                    </div>
                </div>

                {/* Units */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">🚪</span>
                        <span className="text-sm text-gray-500">Units</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.units.total}
                    </div>
                    <div className="text-sm">
                        <span className="text-green-600">{stats.units.occupancyRate}% occupied</span>
                        {' · '}
                        <span className="text-amber-600">{stats.units.vacant} vacant</span>
                    </div>
                </div>

                {/* Tenants */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">👥</span>
                        <span className="text-sm text-gray-500">Tenants</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        {stats.tenants.total}
                    </div>
                    <div className="text-sm text-gray-500">
                        <span className="text-green-600">{stats.tenants.active} active</span>
                        {' · '}
                        <span className="text-amber-600">{stats.tenants.moveOuts} pending move-out</span>
                    </div>
                </div>

                {/* Collections */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">💰</span>
                        <span className="text-sm text-gray-500">This Month</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        ${stats.financials.collected.toLocaleString()}
                    </div>
                    <div className="text-sm">
                        <span className="text-green-600">{stats.financials.collectionRate}% collected</span>
                        {' · '}
                        <span className="text-amber-600">${stats.financials.pending.toLocaleString()} pending</span>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Maintenance Overview */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Maintenance Requests</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-gray-600">
                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                Open
                            </span>
                            <span className="font-semibold">{stats.maintenance.open}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-gray-600">
                                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                In Progress
                            </span>
                            <span className="font-semibold">{stats.maintenance.inProgress}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-gray-600">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                Completed (YTD)
                            </span>
                            <span className="font-semibold">{stats.maintenance.completed}</span>
                        </div>
                    </div>
                </div>

                {/* Upcoming Lease Expirations */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Expiring Leases (30 days)</h3>
                    <div className="space-y-3">
                        {[
                            { tenant: 'Alice Brown', unit: 'Sunset Apt #101', date: 'Jan 31' },
                            { tenant: 'David Wilson', unit: 'Sunset Apt #102', date: 'Feb 14' },
                        ].map((lease, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                <div>
                                    <p className="font-medium text-gray-900">{lease.tenant}</p>
                                    <p className="text-sm text-gray-500">{lease.unit}</p>
                                </div>
                                <span className="text-sm text-amber-600">{lease.date}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {[
                            { action: 'Rent payment received', detail: 'Alice Brown - $1,800', time: '2 hours ago' },
                            { action: 'Maintenance completed', detail: 'Leaky faucet - Unit #101', time: '5 hours ago' },
                            { action: 'New application', detail: 'Bay View #A2', time: '1 day ago' },
                        ].map((activity, i) => (
                            <div key={i} className="py-2 border-b border-gray-100 last:border-0">
                                <p className="font-medium text-gray-900">{activity.action}</p>
                                <p className="text-sm text-gray-500">{activity.detail}</p>
                                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Add Property', icon: '🏢', href: '/admin/properties/new' },
                        { label: 'Add Tenant', icon: '👤', href: '/admin/tenants/new' },
                        { label: 'Create Lease', icon: '📄', href: '/admin/leases/new' },
                        { label: 'Run Payouts', icon: '💰', href: '/admin/payouts/run' },
                    ].map((action, i) => (
                        <a
                            key={i}
                            href={action.href}
                            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        >
                            <span className="text-2xl">{action.icon}</span>
                            <span className="text-sm font-medium text-gray-700">{action.label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
