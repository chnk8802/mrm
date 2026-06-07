import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronUp, ChevronDown, Wrench, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import technicianService from '@/api/technicianService';

const columns = [
    { label: 'Name',   col: 'name' },
    { label: 'Phone',  col: 'phone' },
    { label: 'Email',  col: 'email' },
    { label: 'Joined', col: 'createdAt' },
    { label: 'Status', col: 'isActive' },
];

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

    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                setLoading(true);
                const response = await technicianService.getTechnicians();
                setTechnicians(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch technicians');
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

            {/* Error */}
            {error && (
                <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-lg text-sm shrink-0">
                    {error}
                </div>
            )}

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
                                onClick={() => navigate(`/users/${tech._id}`)}
                            >
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                            <Wrench className="w-3.5 h-3.5 text-green-500" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground">{tech.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">{tech.phone || '—'}</td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">{tech.email || '—'}</td>
                                <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(tech.createdAt)}</td>
                                <td className="py-3 px-4">
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
                    <div key={tech._id} onClick={() => navigate(`/users/${tech._id}`)}
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
            <div className="px-4 py-3 border-t border-border bg-background shrink-0 mb-16 md:mb-0">
                <p className="text-xs text-muted-foreground text-center">
                    {!loading && `${filtered.length} technician${filtered.length !== 1 ? 's' : ''}`}
                </p>
            </div>
        </div>
    );
};

export default TechnicianList;

// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//     Search,
//     ChevronUp,
//     ChevronDown,
//     Wrench,
//     X,
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import technicianService from '@/api/technicianService';

// const TechnicianList = () => {
//     const navigate = useNavigate();

//     const [technicians, setTechnicians] = useState([]);
//     const [filtered, setFiltered] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     const [searchOpen, setSearchOpen] = useState(false);
//     const [searchQuery, setSearchQuery] = useState('');

//     const [sortBy, setSortBy] = useState('name');
//     const [sortOrder, setSortOrder] = useState('asc');

//     const fetchTechnicians = async () => {
//         try {
//             setLoading(true);
//             setError(null);
//             const response = await technicianService.getTechnicians();
//             setTechnicians(response.data);
//             setFiltered(response.data);
//         } catch (err) {
//             setError(err.response?.data?.message || 'Failed to fetch technicians');
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchTechnicians();
//     }, []);

//     // Client-side search and sort
//     useEffect(() => {
//         let result = [...technicians];

//         if (searchQuery) {
//             const q = searchQuery.toLowerCase();
//             result = result.filter(t =>
//                 t.name?.toLowerCase().includes(q) ||
//                 t.phone?.toLowerCase().includes(q) ||
//                 t.email?.toLowerCase().includes(q)
//             );
//         }

//         result.sort((a, b) => {
//             const aVal = a[sortBy] || '';
//             const bVal = b[sortBy] || '';
//             return sortOrder === 'asc'
//                 ? aVal.localeCompare(bVal)
//                 : bVal.localeCompare(aVal);
//         });

//         setFiltered(result);
//     }, [searchQuery, sortBy, sortOrder, technicians]);

//     const handleSort = (column) => {
//         if (sortBy === column) {
//             setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
//         } else {
//             setSortBy(column);
//             setSortOrder('asc');
//         }
//     };

//     const renderSortIcon = (column) => {
//         if (sortBy !== column) return null;
//         return sortOrder === 'asc'
//             ? <ChevronUp className="w-4 h-4" />
//             : <ChevronDown className="w-4 h-4" />;
//     };

//     const formatDate = (dateString) =>
//         new Date(dateString).toLocaleDateString('en-US', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric',
//         });

//     return (
//         <div className="space-y-6 p-4">
//             {/* Header */}
//             <div className="flex items-center justify-end gap-2">
//                 <div className="flex items-center gap-2">
//                     {searchOpen && (
//                         <Input
//                             autoFocus
//                             type="text"
//                             placeholder="Search technicians..."
//                             value={searchQuery}
//                             onChange={(e) => setSearchQuery(e.target.value)}
//                             className="w-56"
//                         />
//                     )}
//                     <Button
//                         variant="outline"
//                         size="icon"
//                         onClick={() => {
//                             setSearchOpen(prev => !prev);
//                             if (searchOpen) setSearchQuery('');
//                         }}
//                     >
//                         {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
//                     </Button>
//                 </div>
//             </div>

//             {/* Error Message */}
//             {error && (
//                 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
//                     {error}
//                 </div>
//             )}

//             {/* Technicians Table */}
//             <Card className="shadow-sm">
//                 <CardContent className="p-0">
//                     <div className="overflow-x-auto">
//                         <table className="w-full">
//                             <thead>
//                                 <tr className="border-b border-gray-200 bg-gray-50">
//                                     {[
//                                         { label: 'Name', col: 'name' },
//                                         { label: 'Phone', col: 'phone' },
//                                         { label: 'Email', col: 'email' },
//                                         { label: 'Joined', col: 'createdAt' },
//                                     ].map(({ label, col }) => (
//                                         <th
//                                             key={col}
//                                             className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
//                                             onClick={() => handleSort(col)}
//                                         >
//                                             <div className="flex items-center gap-1">
//                                                 {label}
//                                                 {renderSortIcon(col)}
//                                             </div>
//                                         </th>
//                                     ))}
//                                     <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
//                                         Status
//                                     </th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {loading ? (
//                                     <tr>
//                                         <td colSpan="5" className="text-center py-8 text-gray-500">
//                                             Loading technicians...
//                                         </td>
//                                     </tr>
//                                 ) : filtered.length === 0 ? (
//                                     <tr>
//                                         <td colSpan="5" className="text-center py-8 text-gray-500">
//                                             {searchQuery
//                                                 ? 'No technicians found matching your search'
//                                                 : 'No technicians found'}
//                                         </td>
//                                     </tr>
//                                 ) : (
//                                     filtered.map(tech => (
//                                         <tr
//                                             key={tech._id}
//                                             className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
//                                             onClick={() => navigate(`/users/${tech._id}`)}
//                                         >
//                                             <td className="py-3 px-4">
//                                                 <div className="flex items-center gap-2">
//                                                     <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
//                                                         <Wrench className="w-4 h-4 text-green-700" />
//                                                     </div>
//                                                     <div className="font-medium text-gray-900">{tech.name}</div>
//                                                 </div>
//                                             </td>
//                                             <td className="py-3 px-4 text-sm text-gray-600">
//                                                 {tech.phone || '-'}
//                                             </td>
//                                             <td className="py-3 px-4 text-sm text-gray-600">
//                                                 {tech.email || '-'}
//                                             </td>
//                                             <td className="py-3 px-4 text-sm text-gray-600">
//                                                 {formatDate(tech.createdAt)}
//                                             </td>
//                                             <td className="py-3 px-4">
//                                                 <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tech.isActive
//                                                         ? 'bg-green-100 text-green-700'
//                                                         : 'bg-red-100 text-red-700'
//                                                     }`}>
//                                                     {tech.isActive ? 'Active' : 'Inactive'}
//                                                 </span>
//                                             </td>
//                                         </tr>
//                                     ))
//                                 )}
//                             </tbody>
//                         </table>
//                     </div>
//                 </CardContent>
//             </Card>

//             {/* Total count */}
//             {!loading && filtered.length > 0 && (
//                 <p className="text-sm text-gray-500 text-center">
//                     Showing {filtered.length} of {technicians.length} technician{technicians.length !== 1 ? 's' : ''}
//                 </p>
//             )}
//         </div>
//     );
// };

// export default TechnicianList;