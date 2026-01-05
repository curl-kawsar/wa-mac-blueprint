'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export default function PayoutsPage() {
    const router = useRouter();
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [showRunModal, setShowRunModal] = useState(false);
    const [runLoading, setRunLoading] = useState(false);
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');

    const fetchRuns = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/payouts?page=${page}&limit=20`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setRuns(data.data || []);
                setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch runs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRuns();
        // Set default period (last month)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        setPeriodStart(firstDay.toISOString().split('T')[0]);
        setPeriodEnd(lastDay.toISOString().split('T')[0]);
    }, []);

    const handleRunPayouts = async () => {
        setRunLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/payouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ periodStart, periodEnd }),
            });

            if (res.ok) {
                setShowRunModal(false);
                fetchRuns();
            }
        } catch (error) {
            console.error('Payout run failed:', error);
        } finally {
            setRunLoading(false);
        }
    };

    const columns = [
        {
            header: 'Run',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">{row.runNumber}</p>
                    <p className="text-sm text-gray-500">
                        {new Date(row.createdAt).toLocaleString()}
                    </p>
                </div>
            ),
        },
        {
            header: 'Period',
            render: (row) => (
                <div className="text-sm">
                    <p>{new Date(row.periodStart).toLocaleDateString()}</p>
                    <p className="text-gray-500">to {new Date(row.periodEnd).toLocaleDateString()}</p>
                </div>
            ),
        },
        {
            header: 'Statements',
            render: (row) => row.summary?.totalStatements || 0,
        },
        {
            header: 'Payouts',
            render: (row) => row.summary?.totalPayouts || 0,
        },
        {
            header: 'Total',
            render: (row) => (
                <span className="font-medium">
                    ${row.summary?.totalAmount?.toLocaleString() || 0}
                </span>
            ),
        },
        {
            header: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
                    <p className="text-gray-600">Manage owner payouts and statements</p>
                </div>
                <Button onClick={() => setShowRunModal(true)}>
                    + Run Monthly Payouts
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon="💰"
                    label="Last Month"
                    value="$45,200"
                    footer="Total paid out"
                />
                <StatCard
                    icon="📄"
                    label="Statements"
                    value="12"
                    footer="Generated"
                />
                <StatCard
                    icon="⏳"
                    label="Pending"
                    value="$8,650"
                    footer="Awaiting approval"
                />
                <StatCard
                    icon="✅"
                    label="Success Rate"
                    value="100%"
                    changeType="positive"
                    footer="No failures"
                />
            </div>

            <Card padding="none">
                <Table
                    columns={columns}
                    data={runs}
                    loading={loading}
                    emptyMessage="No payout runs found"
                    onRowClick={(row) => router.push(`/admin/payouts/${row._id}`)}
                />

                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-200">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={(p) => fetchRuns(p)}
                        />
                    </div>
                )}
            </Card>

            {/* Run Modal */}
            <Modal
                isOpen={showRunModal}
                onClose={() => setShowRunModal(false)}
                title="Run Monthly Payouts"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setShowRunModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRunPayouts} loading={runLoading}>
                            Run Payouts
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        This will generate statements and initiate payouts for all active owners
                        for the selected period.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Period Start"
                            value={periodStart}
                            onChange={(e) => setPeriodStart(e.target.value)}
                        />
                        <Input
                            type="date"
                            label="Period End"
                            value={periodEnd}
                            onChange={(e) => setPeriodEnd(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
