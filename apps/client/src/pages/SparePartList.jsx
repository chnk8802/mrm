import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

const SparePartList = () => {
    const navigate = useNavigate();

    const [spareParts, setSpareParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });

    const fetchSpareParts = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pagination.limit,
                search: search || undefined
            };
            const response = await sparePartService.getSpareParts(params);
            setSpareParts(response.data);
            setPagination(response.pagination);
        } catch (err) {
            console.error('Error fetching spare parts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpareParts();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchSpareParts(1);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this spare part?')) return;
        try {
            await sparePartService.deleteSparePart(id);
            fetchSpareParts(pagination.page);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete spare part');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Spare Parts</h1>
                <Button onClick={() => navigate('/spare-parts/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Spare Part
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex gap-4 mb-4">
                        <Input
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-md"
                        />
                        <Button type="submit">
                            <Search className="mr-2 h-4 w-4" />
                            Search
                        </Button>
                    </form>

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4">Part Number</th>
                                            <th className="text-left py-3 px-4">Name</th>
                                            <th className="text-left py-3 px-4">Category</th>
                                            <th className="text-left py-3 px-4">Status</th>
                                            <th className="text-right py-3 px-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {spareParts.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                                    No spare parts found
                                                </td>
                                            </tr>
                                        ) : (
                                            spareParts.map((part) => (
                                                <tr key={part._id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4">{part.partNumber}</td>
                                                    <td className="py-3 px-4">{part.name}</td>
                                                    <td className="py-3 px-4">
                                                        {CATEGORY_LABELS[part.category] || part.category}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 rounded text-sm ${part.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                            {part.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/spare-parts/${part._id}`)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(part._id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {pagination.pages > 1 && (
                                <div className="flex justify-center gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        disabled={pagination.page === 1}
                                        onClick={() => fetchSpareParts(pagination.page - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <span className="flex items-center px-4">
                                        Page {pagination.page} of {pagination.pages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        disabled={pagination.page === pagination.pages}
                                        onClick={() => fetchSpareParts(pagination.page + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SparePartList;
