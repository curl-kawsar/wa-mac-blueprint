'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';

export default function OwnersPage() {
    const router = useRouter();
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [search, setSearch] = useState('');

    const fetchOwners = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({ page, limit: 20 });
            if (search) params.append('search', search);

            const res = await fetch(`/api/owners?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setOwners(data.data || []);
                setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch owners:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOwners();
    }, []);

    const columns = [
        {
            header: 'Owner',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
            header: 'Properties',
            render: (row) => (
                <span>{row.propertyCount || 0}</span>
            ),
        },
        {
            header: 'Mgmt Fee',
            render: (row) => (
                <span>{row.contract?.managementFeePercent || 0}%</span>
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
                            router.push(`/admin/owners/${row._id}`);
                        }}
                    >
                        View
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/owners/${row._id}/edit`);
                        }}
                    >
                        Edit
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Owners</h1>
                    <p className="text-gray-600">Manage property owners</p>
                </div>
                <Button onClick={() => router.push('/admin/owners/new')}>
                    + Add Owner
                </Button>
            </div>

            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Search owners..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchOwners(1)}
                            className="max-w-sm"
                        />
                        <Button variant="secondary" onClick={() => fetchOwners(1)}>
                            Search
                        </Button>
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={owners}
                    loading={loading}
                    emptyMessage="No owners found"
                    onRowClick={(row) => router.push(`/admin/owners/${row._id}`)}
                />

                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-200">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={(p) => fetchOwners(p)}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
