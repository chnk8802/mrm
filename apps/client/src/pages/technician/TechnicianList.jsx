import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    ChevronUp,
    ChevronDown,
    Wrench,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import technicianService from '@/services/technicianService';

const TechnicianList = () => {
    const navigate = useNavigate();

    const [technicians, setTechnicians] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    const fetchTechnicians = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await technicianService.getTechnicians();
            setTechnicians(response.data);
            setFiltered(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch technicians');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTechnicians();
    }, []);

    // Client-side search and sort
    useEffect(() => {
        let result = [...technicians];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.name?.toLowerCase().includes(q) ||
                t.phone?.toLowerCase().includes(q) ||
                t.email?.toLowerCase().includes(q)
            );
        }

        result.sort((a, b) => {
            const aVal = a[sortBy] || '';
            const bVal = b[sortBy] || '';
            return sortOrder === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
        });

        setFiltered(result);
    }, [searchQuery, sortBy, sortOrder, technicians]);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const renderSortIcon = (column) => {
        if (sortBy !== column) return null;
        return sortOrder === 'asc'
            ? <ChevronUp className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />;
    };

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-end gap-2">
                <div className="flex items-center gap-2">
                    {searchOpen && (
                        <Input
                            autoFocus
                            type="text"
                            placeholder="Search technicians..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-56"
                        />
                    )}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                            setSearchOpen(prev => !prev);
                            if (searchOpen) setSearchQuery('');
                        }}
                    >
                        {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Technicians Table */}
            <Card className="shadow-sm">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    {[
                                        { label: 'Name', col: 'name' },
                                        { label: 'Phone', col: 'phone' },
                                        { label: 'Email', col: 'email' },
                                        { label: 'Joined', col: 'createdAt' },
                                    ].map(({ label, col }) => (
                                        <th
                                            key={col}
                                            className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort(col)}
                                        >
                                            <div className="flex items-center gap-1">
                                                {label}
                                                {renderSortIcon(col)}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-500">
                                            Loading technicians...
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-500">
                                            {searchQuery
                                                ? 'No technicians found matching your search'
                                                : 'No technicians found'}
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(tech => (
                                        <tr
                                            key={tech._id}
                                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                            onClick={() => navigate(`/users/${tech._id}`)}
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                        <Wrench className="w-4 h-4 text-green-700" />
                                                    </div>
                                                    <div className="font-medium text-gray-900">{tech.name}</div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {tech.phone || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {tech.email || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {formatDate(tech.createdAt)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tech.isActive
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {tech.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Total count */}
            {!loading && filtered.length > 0 && (
                <p className="text-sm text-gray-500 text-center">
                    Showing {filtered.length} of {technicians.length} technician{technicians.length !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
};

export default TechnicianList;