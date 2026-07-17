import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronUp, ChevronDown, Wrench, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import technicianService from '@/api/technicianService';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const columns = [
    { label: 'Name', col: 'name' },
    { label: 'Phone', col: 'phone' },
    { label: 'Email', col: 'email' },
    { label: 'Joined', col: 'createdAt' },
    { label: 'Status', col: 'isActive' },
];

const TechnicianList = () => {
    const navigate = useNavigate();
    useDocumentTitle("Technicians");

    const [technicians, setTechnicians] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                setLoading(true);
                const response = await technicianService.getTechnicians();
                setTechnicians(response.data);
            } catch (err) {
                const errorData = err.response?.data;

                if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                    toast.error(errorData.errors[0].message);
                } else {
                    toast.error(errorData?.message || 'Failed to fetch technicians');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTechnicians();
    }, []);

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
            return sortOrder === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
        });
        setFiltered(result);
    }, [searchQuery, sortBy, sortOrder, technicians]);

    const handleSort = (column) => {
        if (sortBy === column) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        else { setSortBy(column); setSortOrder('asc'); }
    };

    const renderSortIcon = (col) => {
        if (sortBy !== col) return null;
        return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    return (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
                <h1 className="text-base font-semibold text-foreground">
                    Technicians
                    {!loading && <span className="ml-2 text-xs text-muted-foreground font-normal">{filtered.length} of {technicians.length}</span>}
                </h1>
                <div className="flex items-center gap-2">
                    {searchOpen && (
                        <Input autoFocus placeholder="Search technicians..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-52 h-8 text-sm"
                        />
                    )}
                    <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => { setSearchOpen(p => !p); if (searchOpen) setSearchQuery(''); }}
                    >
                        {searchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                    </Button>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block flex-1 overflow-y-auto">
                <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
                        <tr className="border-b border-border">
                            {columns.map(({ label, col }) => (
                                <th key={col}
                                    className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                                    onClick={() => handleSort(col)}
                                >
                                    <div className="flex items-center gap-1">{label} {renderSortIcon(col)}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-16 text-sm text-muted-foreground">Loading technicians...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-16 text-sm text-muted-foreground">
                                {searchQuery ? 'No technicians found matching your search' : 'No technicians found'}
                            </td></tr>
                        ) : filtered.map(tech => (
                            <tr key={tech._id}
                                className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                                onClick={() => navigate(`/app/users/${tech._id}`)}
                            >
                                <td className="py-1 px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                            <Wrench className="w-3.5 h-3.5 text-green-500" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground">{tech.name}</span>
                                    </div>
                                </td>
                                <td className="py-1 px-4 text-sm text-muted-foreground">{tech.phone || '—'}</td>
                                <td className="py-1 px-4 text-sm text-muted-foreground">{tech.email || '—'}</td>
                                <td className="py-1 px-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(tech.createdAt)}</td>
                                <td className="py-1 px-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${tech.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {tech.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex-1 overflow-y-auto divide-y divide-border">
                {loading ? (
                    <p className="text-center py-16 text-sm text-muted-foreground">Loading...</p>
                ) : filtered.length === 0 ? (
                    <p className="text-center py-16 text-sm text-muted-foreground">No technicians found</p>
                ) : filtered.map(tech => (
                    <div key={tech._id} onClick={() => navigate(`/app/users/${tech._id}`)}
                        className="px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                <Wrench className="w-4 h-4 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{tech.name}</p>
                                <p className="text-xs text-muted-foreground">{tech.phone || tech.email}</p>
                            </div>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${tech.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {tech.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-border bg-background shrink-0 mb-16 md:mb-0">
                <p className="text-xs text-muted-foreground text-center">
                    {!loading && `${filtered.length} technician${filtered.length !== 1 ? 's' : ''}`}
                </p>
            </div>
        </div>
    );
};

export default TechnicianList;