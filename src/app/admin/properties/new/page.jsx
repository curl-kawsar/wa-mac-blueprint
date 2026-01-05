'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input, TextArea, Select } from '@/components/ui/Input';

export default function NewPropertyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        propertyType: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        yearBuilt: '',
        squareFeet: '',
        description: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/properties', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    propertyType: formData.propertyType,
                    address: {
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        zipCode: formData.zipCode,
                        country: 'USA',
                    },
                    details: {
                        yearBuilt: parseInt(formData.yearBuilt) || undefined,
                        squareFeet: parseInt(formData.squareFeet) || undefined,
                    },
                    description: formData.description,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/admin/properties/${data._id}`);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create property');
            }
        } catch (err) {
            setError('Failed to create property');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add Property</h1>
                    <p className="text-gray-600">Create a new property listing</p>
                </div>
                <Button variant="secondary" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <Card className="space-y-6">
                    <CardHeader title="Property Details" />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Property Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Sunset Apartments"
                            className="col-span-2"
                        />

                        <Select
                            label="Property Type"
                            name="propertyType"
                            value={formData.propertyType}
                            onChange={handleChange}
                            required
                            options={[
                                { value: 'single_family', label: 'Single Family' },
                                { value: 'multi_family', label: 'Multi Family' },
                                { value: 'condo', label: 'Condo' },
                                { value: 'townhouse', label: 'Townhouse' },
                                { value: 'commercial', label: 'Commercial' },
                            ]}
                        />

                        <Input
                            label="Year Built"
                            name="yearBuilt"
                            type="number"
                            value={formData.yearBuilt}
                            onChange={handleChange}
                            placeholder="e.g., 2000"
                        />

                        <Input
                            label="Square Feet"
                            name="squareFeet"
                            type="number"
                            value={formData.squareFeet}
                            onChange={handleChange}
                            placeholder="e.g., 2500"
                        />
                    </div>

                    <hr className="border-gray-200" />

                    <CardHeader title="Address" />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Street Address"
                            name="street"
                            value={formData.street}
                            onChange={handleChange}
                            required
                            placeholder="123 Main St"
                            className="col-span-2"
                        />

                        <Input
                            label="City"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                            placeholder="Los Angeles"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="State"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                                placeholder="CA"
                            />

                            <Input
                                label="ZIP Code"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleChange}
                                required
                                placeholder="90001"
                            />
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    <TextArea
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Brief description of the property..."
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                            Create Property
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
}
