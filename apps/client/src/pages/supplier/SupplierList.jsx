import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import supplierService from '@/services/supplierService';

const SupplierList = () => {
    const navigate = useNavigate();

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const response = await supplierService.getSuppliers({
                page: pagination.page,
                limit: pagination.limit,
                search: searchQuery
            });
            setSuppliers(response.data);
            setPagination(prev => ({
                ...prev,
                total: response.pagination.total,
                pages: response.pagination.pages
            }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch suppliers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [pagination.page, pagination.limit]);

    useEffect(() => {
        if (!searchQuery) {
            fetchSuppliers();
        }
    }, [searchQuery]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this supplier?')) return;
        try {
            await supplierService.deleteSupplier(id);
            fetchSuppliers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete supplier');
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Suppliers</h1>
                <Button onClick={() => navigate('/suppliers/create')}>
                    <Plus className="mr-2 h-4 w-4" /> Add Supplier
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search suppliers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500">{error}</div>
                    ) : suppliers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Truck className="mx-auto h-12 w-12 mb-4" />
                            <p>No suppliers found</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Contact Person</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {suppliers.map((supplier) => (
                                    <tr key={supplier._id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 text-sm font-medium">{supplier.name}</td>
                                        <td className="px-4 py-3 text-sm">{supplier.contactPerson || '-'}</td>
                                        <td className="px-4 py-3 text-sm">{supplier.phone || '-'}</td>
                                        <td className="px-4 py-3 text-sm">{supplier.email || '-'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => navigate(`/suppliers/${supplier._id}`)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => navigate(`/suppliers/${supplier._id}/edit`)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier._id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {!loading && suppliers.length > 0 && (
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierList;
