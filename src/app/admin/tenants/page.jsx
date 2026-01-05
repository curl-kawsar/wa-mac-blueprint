'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';

export default function TenantsPage() {
    const router = useRouter();
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchTenants = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({ page, limit: 20 });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);

            const res = await fetch(`/api/tenants?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setTenants(data.data || []);
                setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, [statusFilter]);

    const columns = [
        {
            header: 'Tenant',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {row.firstName?.[0]}{row.lastName?.[0]}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{row.firstName} {row.lastName}</p>
                        <p className="text-sm text-gray-500">{row.email}</p>
                    </div>
                </div>
            ),
        },
        {
            header: 'Phone',
            accessor: 'phone',
        },
        {
            header: 'Unit',
            render: (row) => (
                <span>{row.currentUnit?.unitNumber || '-'}</span>
            ),
        },
        {
            header: 'Move In',
            render: (row) => (
                <span>
                    {row.moveInDate
                        ? new Date(row.moveInDate).toLocaleDateString()
                        : '-'
                    }
                </span>
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
                            router.push(`/admin/tenants/${row._id}`);
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
                    <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
                    <p className="text-gray-600">Manage tenants and applications</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => router.push('/admin/tenants/applications')}>
                        Applications
                    </Button>
                    <Button onClick={() => router.push('/admin/tenants/new')}>
                        + Add Tenant
                    </Button>
                </div>
            </div>

            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Search tenants..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchTenants(1)}
                            className="max-w-sm"
                        />
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                                { value: 'pending', label: 'Pending' },
                            ]}
                            placeholder="All Statuses"
                            className="w-40"
                        />
                        <Button variant="secondary" onClick={() => fetchTenants(1)}>
                            Search
                        </Button>
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={tenants}
                    loading={loading}
                    emptyMessage="No tenants found"
                    onRowClick={(row) => router.push(`/admin/tenants/${row._id}`)}
                />

                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-200">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={(p) => fetchTenants(p)}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
