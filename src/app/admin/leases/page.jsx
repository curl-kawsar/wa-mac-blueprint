'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';

export default function LeasesPage() {
    const router = useRouter();
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [statusFilter, setStatusFilter] = useState('');

    const fetchLeases = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({ page, limit: 20 });
            if (statusFilter) params.append('status', statusFilter);

            const res = await fetch(`/api/leases?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setLeases(data.data || []);
                setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch leases:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeases();
    }, [statusFilter]);

    const columns = [
        {
            header: 'Tenant',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">
                        {row.tenant?.firstName} {row.tenant?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{row.tenant?.email}</p>
                </div>
            ),
        },
        {
            header: 'Property / Unit',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">{row.property?.name}</p>
                    <p className="text-sm text-gray-500">Unit {row.unit?.unitNumber}</p>
                </div>
            ),
        },
        {
            header: 'Term',
            render: (row) => (
                <div className="text-sm">
                    <p>{new Date(row.startDate).toLocaleDateString()}</p>
                    <p className="text-gray-500">to {new Date(row.endDate).toLocaleDateString()}</p>
                </div>
            ),
        },
        {
            header: 'Rent',
            render: (row) => (
                <span className="font-medium">${row.rent?.monthlyAmount?.toLocaleString()}/mo</span>
            ),
        },
        {
            header: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
        },
        {
            header: 'Actions',
            render: (row) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/leases/${row._id}`);
                        }}
                    >
                        View
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
                    <p className="text-gray-600">Manage lease agreements</p>
                </div>
                <Button onClick={() => router.push('/admin/leases/new')}>
                    + Create Lease
                </Button>
            </div>

            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex gap-4">
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'expired', label: 'Expired' },
                                { value: 'terminated', label: 'Terminated' },
                            ]}
                            placeholder="All Statuses"
                            className="w-40"
                        />
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={leases}
                    loading={loading}
                    emptyMessage="No leases found"
                    onRowClick={(row) => router.push(`/admin/leases/${row._id}`)}
                />

                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-200">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={(p) => fetchLeases(p)}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
