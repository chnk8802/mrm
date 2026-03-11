import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import supplierService from '@/services/supplierService';

const SupplierEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        isActive: true
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSupplier = async () => {
            try {
                const response = await supplierService.getSupplierById(id);
                const supplier = response.data;
                setFormData({
                    name: supplier.name || '',
                    contactPerson: supplier.contactPerson || '',
                    phone: supplier.phone || '',
                    email: supplier.email || '',
                    address: supplier.address || '',
                    notes: supplier.notes || '',
                    isActive: supplier.isActive !== false
                });
            } catch (err) {
                alert('Failed to load supplier');
                navigate('/suppliers');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchSupplier();
    }, [id, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            await supplierService.updateSupplier(id, formData);
            navigate('/suppliers');
        } catch (err) {
            if (err.response?.data?.errors) {
                const fieldErrors = {};
                err.response.data.errors.forEach(error => {
                    fieldErrors[error.path[0]] = error.message;
                });
                setErrors(fieldErrors);
            } else {
                setErrors({ general: err.response?.data?.message || 'Failed to update supplier' });
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Edit Supplier</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" name="name" value={formData.name} onChange={handleChange} className={errors.name ? 'border-red-500' : ''} />
                            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="contactPerson">Contact Person</Label>
                            <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="address">Address</Label>
                            <textarea id="address" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border rounded-md min-h-[80px]" />
                        </div>

                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="w-full px-3 py-2 border rounded-md min-h-[80px]" />
                        </div>

                        <div className="flex items-center gap-2">
                            <input id="isActive" type="checkbox" checked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} />
                            <Label htmlFor="isActive">Active</Label>
                        </div>

                        {errors.general && (
                            <div className="p-3 bg-red-50 text-red-500 rounded-md">{errors.general}</div>
                        )}

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => navigate('/suppliers')}>Cancel</Button>
                            <Button type="submit" disabled={saving}>
                                <Save className="mr-2 h-4 w-4" />
                                {saving ? 'Saving...' : 'Update Supplier'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

export default SupplierEdit;
