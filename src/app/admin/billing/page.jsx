'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, StatCard } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';

export default function BillingPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [statusFilter, setStatusFilter] = useState('');

    const fetchInvoices = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({ page, limit: 20 });
            if (statusFilter) params.append('status', statusFilter);

            const res = await fetch(`/api/billing/invoices?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setInvoices(data.data || []);
                setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [statusFilter]);

    const columns = [
        {
            header: 'Invoice',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">{row.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">
                        {new Date(row.createdAt).toLocaleDateString()}
                    </p>
                </div>
            ),
        },
        {
            header: 'Tenant',
            render: (row) => (
                <div>
                    <p className="text-gray-900">
                        {row.tenant?.firstName} {row.tenant?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{row.property?.name}</p>
                </div>
            ),
        },
        {
            header: 'Due Date',
            render: (row) => (
                <span className={row.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                    {new Date(row.dueDate).toLocaleDateString()}
                </span>
            ),
        },
        {
            header: 'Total',
            render: (row) => (
                <span className="font-medium">${row.total?.toLocaleString()}</span>
            ),
        },
        {
            header: 'Balance',
            render: (row) => (
                <span className={row.balanceDue > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                    ${row.balanceDue?.toLocaleString()}
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
                    <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
                    <p className="text-gray-600">Manage invoices and payments</p>
                </div>
                <Button onClick={() => router.push('/admin/billing/new')}>
                    + Create Invoice
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon="💰"
                    label="This Month"
                    value="$68,400"
                    footer="Collected"
                />
                <StatCard
                    icon="⏳"
                    label="Pending"
                    value="$7,200"
                    footer="4 invoices"
                />
                <StatCard
                    icon="⚠️"
                    label="Overdue"
                    value="$2,400"
                    changeType="negative"
                    footer="2 invoices"
                />
                <StatCard
                    icon="📊"
                    label="Collection Rate"
                    value="90.5%"
                    changeType="positive"
                    footer="This month"
                />
            </div>

            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex gap-4">
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: 'pending', label: 'Pending' },
                                { value: 'paid', label: 'Paid' },
                                { value: 'partially_paid', label: 'Partially Paid' },
                                { value: 'overdue', label: 'Overdue' },
                            ]}
                            placeholder="All Statuses"
                            className="w-40"
                        />
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={invoices}
                    loading={loading}
                    emptyMessage="No invoices found"
                    onRowClick={(row) => router.push(`/admin/billing/${row._id}`)}
                />

                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-200">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={(p) => fetchInvoices(p)}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
