import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import supplierService from '@/services/supplierService';

const SupplierDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSupplier = async () => {
            try {
                const response = await supplierService.getSupplierById(id);
                setSupplier(response.data);
            } catch (err) {
                alert('Failed to load supplier');
                navigate('/suppliers');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchSupplier();
    }, [id, navigate]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this supplier?')) return;
        try {
            await supplierService.deleteSupplier(id);
            navigate('/suppliers');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete supplier');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;
    }

    if (!supplier) return null;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/suppliers')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Supplier Details</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/suppliers/${id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium">{supplier.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Contact Person</p>
                            <p className="font-medium">{supplier.contactPerson || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span className={`px-2 py-1 rounded text-sm ${supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {supplier.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium">{supplier.phone || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{supplier.email || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="font-medium whitespace-pre-line">{supplier.address || '-'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-line">{supplier.notes || 'No notes'}</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Timestamps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Created At</p>
                            <p className="font-medium">{new Date(supplier.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Last Updated</p>
                            <p className="font-medium">{new Date(supplier.updatedAt).toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SupplierDetails;
