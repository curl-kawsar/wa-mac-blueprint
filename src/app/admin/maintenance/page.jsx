'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';

export default function MaintenancePage() {
    const router = useRouter();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    const fetchRequests = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({ page, limit: 20 });
            if (statusFilter) params.append('status', statusFilter);
            if (priorityFilter) params.append('priority', priorityFilter);

            const res = await fetch(`/api/maintenance?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setRequests(data.data || []);
                setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
            }
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [statusFilter, priorityFilter]);

    const priorityColors = {
        low: 'default',
        medium: 'warning',
        high: 'danger',
        emergency: 'danger',
    };

    const columns = [
        {
            header: 'Request',
            render: (row) => (
                <div>
                    <p className="font-medium text-gray-900">{row.title}</p>
                    <p className="text-sm text-gray-500">{row.requestNumber}</p>
                </div>
            ),
        },
        {
            header: 'Property / Unit',
            render: (row) => (
                <div>
                    <p className="text-gray-900">{row.property?.name}</p>
                    <p className="text-sm text-gray-500">
                        {row.unit?.unitNumber ? `Unit ${row.unit.unitNumber}` : 'Common Area'}
                    </p>
                </div>
            ),
        },
        {
            header: 'Category',
            render: (row) => (
                <span className="capitalize">{row.category?.replace('_', ' ')}</span>
            ),
        },
        {
            header: 'Priority',
            render: (row) => (
                <Badge variant={priorityColors[row.priority]} className="capitalize">
                    {row.priority}
                </Badge>
            ),
        },
        {
            header: 'Assigned To',
            render: (row) => (
                <span>
                    {row.assignedTo
                        ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}`
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
            header: 'Created',
            render: (row) => (
                <span className="text-sm">
                    {new Date(row.createdAt).toLocaleDateString()}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
                    <p className="text-gray-600">Manage maintenance requests</p>
                </div>
                <Button onClick={() => router.push('/admin/maintenance/new')}>
                    + New Request
                </Button>
            </div>

            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex gap-4">
                        <Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: 'submitted', label: 'Submitted' },
                                { value: 'approved', label: 'Approved' },
                                { value: 'assigned', label: 'Assigned' },
                                { value: 'in_progress', label: 'In Progress' },
                                { value: 'completed', label: 'Completed' },
                            ]}
                            placeholder="All Statuses"
                            className="w-40"
                        />
                        <Select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            options={[
                                { value: 'low', label: 'Low' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'high', label: 'High' },
                                { value: 'emergency', label: 'Emergency' },
                            ]}
                            placeholder="All Priorities"
                            className="w-40"
                        />
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={requests}
                    loading={loading}
                    emptyMessage="No maintenance requests found"
                    onRowClick={(row) => router.push(`/admin/maintenance/${row._id}`)}
                />

                {pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-200">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={(p) => fetchRequests(p)}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
