'use client';

import { useEffect, useState } from 'react';

export default function OwnerDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulated data for now
        setData({
            properties: 2,
            units: 5,
            occupiedUnits: 4,
            monthlyIncome: 12450,
            pendingPayout: 8650,
            lastPayout: 10200,
            lastPayoutDate: 'Dec 15, 2024',
        });
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
                <p className="text-gray-600">Overview of your property portfolio</p>
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
                        {data.properties}
                    </div>
                    <div className="text-sm text-gray-500">
                        {data.units} total units
                    </div>
                </div>

                {/* Occupancy */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">📊</span>
                        <span className="text-sm text-gray-500">Occupancy</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        {Math.round((data.occupiedUnits / data.units) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">
                        {data.occupiedUnits} of {data.units} units occupied
                    </div>
                </div>

                {/* Monthly Income */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">💰</span>
                        <span className="text-sm text-gray-500">Monthly Income</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-1">
                        ${data.monthlyIncome.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                        Expected this month
                    </div>
                </div>

                {/* Pending Payout */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">⏳</span>
                        <span className="text-sm text-gray-500">Pending Payout</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                        ${data.pendingPayout.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                        Scheduled for Jan 15
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Properties List */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Your Properties</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Sunset Apartments', units: 4, occupied: 3, income: 8650, ownership: 100 },
                            { name: 'Oak Street House', units: 1, occupied: 1, income: 4200, ownership: 60 },
                        ].map((property, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                                        🏢
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{property.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {property.occupied}/{property.units} occupied · {property.ownership}% ownership
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-green-600">${property.income.toLocaleString()}</p>
                                    <p className="text-sm text-gray-500">monthly</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <a href="/owner/properties" className="block mt-4 text-center text-purple-600 font-medium hover:text-purple-700">
                        View All Properties →
                    </a>
                </div>

                {/* Recent Statements */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Statements</h3>
                    <div className="space-y-3">
                        {[
                            { period: 'December 2024', status: 'Paid', amount: 10200, date: 'Dec 15' },
                            { period: 'November 2024', status: 'Paid', amount: 9800, date: 'Nov 15' },
                            { period: 'October 2024', status: 'Paid', amount: 10450, date: 'Oct 15' },
                        ].map((statement, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                <div>
                                    <p className="font-medium text-gray-900">{statement.period}</p>
                                    <p className="text-sm text-gray-500">Paid on {statement.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">${statement.amount.toLocaleString()}</p>
                                    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                                        {statement.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <a href="/owner/statements" className="block mt-4 text-center text-purple-600 font-medium hover:text-purple-700">
                        View All Statements →
                    </a>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {[
                        { icon: '💰', title: 'Payout Received', desc: '$10,200 deposited to ****4321', time: 'Dec 15, 2024' },
                        { icon: '📄', title: 'Statement Published', desc: 'December 2024 statement is ready', time: 'Dec 14, 2024' },
                        { icon: '🔧', title: 'Maintenance Completed', desc: 'Leaky faucet repair - Unit #101', time: 'Dec 10, 2024' },
                        { icon: '👤', title: 'New Tenant Move-in', desc: 'Chris Taylor moved into Bay View #A1', time: 'Dec 1, 2024' },
                    ].map((activity, i) => (
                        <div key={i} className="flex items-start gap-4 py-2">
                            <span className="text-xl">{activity.icon}</span>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{activity.title}</p>
                                <p className="text-sm text-gray-500">{activity.desc}</p>
                            </div>
                            <span className="text-sm text-gray-400">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
