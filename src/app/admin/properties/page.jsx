'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export default function PropertiesPage() {
    const router = useRouter();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [search, setSearch] = useState('');

    const fetchProperties = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({ page, limit: 20 });
            if (search) params.append('search', search);

            const res = await fetch(`/api/properties?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setProperties(data.data || []);
                setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    const columns = [
        {
            header: 'Property',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">{row.name}</p>
                    <p className="text-sm text-gray-500">{row.address?.street}, {row.address?.city}</p>
                </div>
            ),
        },
        {
            header: 'Type',
            accessor: 'propertyType',
            render: (row) => (
                <span className="capitalize">{row.propertyType?.replace('_', ' ')}</span>
            ),
        },
        {
            header: 'Units',
            render: (row) => (
                <span>{row.unitCount || 0}</span>
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
                            router.push(`/admin/properties/${row._id}`);
                        }}
                    >
                        View
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/properties/${row._id}/edit`);
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
                    <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
                    <p className="text-gray-600">Manage your property portfolio</p>
                </div>
                <Button onClick={() => router.push('/admin/properties/new')}>
                    + Add Property
                </Button>
            </div>

            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Search properties..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchProperties(1)}
                            className="max-w-sm"
                        />
                        <Button variant="secondary" onClick={() => fetchProperties(1)}>
                            Search
                        </Button>
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={properties}
                    loading={loading}
                    emptyMessage="No properties found"
                    onRowClick={(row) => router.push(`/admin/properties/${row._id}`)}
                />

                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-200">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={(p) => fetchProperties(p)}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
