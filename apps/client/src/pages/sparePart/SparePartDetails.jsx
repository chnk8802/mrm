import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import sparePartService from '@/services/sparePartService';

const CATEGORY_LABELS = {
    'screen': 'Screen',
    'battery': 'Battery',
    'camera': 'Camera',
    'charging-port': 'Charging Port',
    'speaker': 'Speaker',
    'microphone': 'Microphone',
    'motherboard': 'Motherboard',
    'sim-tray': 'SIM Tray',
    'back-panel': 'Back Panel',
    'other': 'Other'
};

const SparePartDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [sparePart, setSparePart] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSparePart = async () => {
            try {
                const response = await sparePartService.getSparePartById(id);
                setSparePart(response.data);
            } catch (err) {
                alert('Failed to load spare part');
                navigate('/spare-parts');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchSparePart();
    }, [id, navigate]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this spare part?')) return;
        try {
            await sparePartService.deleteSparePart(id);
            navigate('/spare-parts');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete spare part');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;
    }

    if (!sparePart) return null;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/spare-parts')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Spare Part Details</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/spare-parts/${id}/edit`)}>
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
                            <p className="text-sm text-gray-500">Part Number</p>
                            <p className="font-medium">{sparePart.partNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium">{sparePart.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Category</p>
                            <p className="font-medium">{CATEGORY_LABELS[sparePart.category] || sparePart.category}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span className={`px-2 py-1 rounded text-sm ${sparePart.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {sparePart.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-line">{sparePart.description || 'No description'}</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Timestamps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Created At</p>
                            <p className="font-medium">{new Date(sparePart.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Last Updated</p>
                            <p className="font-medium">{new Date(sparePart.updatedAt).toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SparePartDetails;
