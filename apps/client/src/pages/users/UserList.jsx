import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight,
    ChevronUp, ChevronDown, UserCog, Wrench, Filter, X,
    ShieldCheck, Shield, ClipboardList, MoreVertical, Check, ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import userService from "@/api/userService";
import { useAuth } from '@/context/AuthContext';

const roleOptions = [
    { value: "admin",   label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "staff",   label: "Staff" },
];

const getRoleIcon = (role) => {
    switch (role) {
        case "superadmin": return <ShieldCheck className="w-3 h-3" />;
        case "admin":      return <Shield className="w-3 h-3" />;
        case "manager":    return <ClipboardList className="w-3 h-3" />;
        case "staff":      return <Wrench className="w-3 h-3" />;
        default:           return <UserCog className="w-3 h-3" />;
    }
};

const getRoleBadge = (role) => {
    switch (role) {
        case "superadmin": return "bg-purple-500/10 text-purple-500";
        case "admin":      return "bg-blue-500/10 text-blue-500";
        case "manager":    return "bg-amber-500/10 text-amber-500";
        case "staff":      return "bg-green-500/10 text-green-500";
        default:           return "bg-muted text-muted-foreground";
    }
};

const pageSizeOptions = [5, 10, 25, 50];

const columns = [
    { label: "Name",    col: "name" },
    { label: "Role",    col: "role" },
    { label: "Email",   col: "email" },
    { label: "Phone",   col: "phone" },
    { label: "Status",  col: "status" },
    { label: "Created", col: "createdAt" },
];

const UserList = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [openActionId, setOpenActionId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [roleOpen, setRoleOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = { page: pagination.page, limit: pagination.limit, sortBy, sortOrder };
            if (searchQuery) params.search = searchQuery;
            if (roleFilter) params.role = roleFilter;
            const response = await userService.getUsers(params);
            setUsers(response.data);
            setPagination(prev => ({ ...prev, total: response.pagination.total, pages: response.pagination.pages }));
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, [pagination.page, pagination.limit, sortBy, sortOrder, roleFilter, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => setPagination(prev => ({ ...prev, page: 1 })), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSort = (column) => {
        if (sortBy === column) setSortOrder(o => o === "asc" ? "desc" : "asc");
        else { setSortBy(column); setSortOrder("asc"); }
    };

    const handleDelete = async (id) => {
        if (id === currentUser?._id) return alert("You cannot delete your own account");
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await userService.deleteUser(id);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete user");
        }
    };

    const clearFilters = () => {
        setSearchQuery("");
        setRoleFilter("");
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const renderSortIcon = (column) => {
        if (sortBy !== column) return null;
        return sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
    };

    const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", {
        year: "numeric", month: "short", day: "numeric"
    });

    return (
        // Full height flex column — fills the main content area
        <div className="flex flex-col h-full">

            {/* ── Sticky Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
                <h1 className="text-base font-semibold text-foreground">Users</h1>
                <div className="flex items-center gap-2">

                    {searchOpen && (
                        <Input
                            autoFocus
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                            className="w-52 h-8 text-sm"
                        />
                    )}
                    <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => { setSearchOpen(p => !p); if (searchOpen) setSearchQuery(""); }}
                    >
                        {searchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                    </Button>

                    {/* Filter */}
                    <div className="relative">
                        <Button variant="outline" size="icon" className="h-8 w-8 relative"
                            onClick={() => setShowFilters(p => !p)}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            {roleFilter && (
                                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px]">1</span>
                            )}
                        </Button>

                        {showFilters && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                                <div className="absolute right-0 mt-2 p-3 bg-card border border-border rounded-lg shadow-lg z-20 w-52">
                                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Role</p>
                                    <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between h-8 text-sm">
                                                {roleFilter ? roleOptions.find(r => r.value === roleFilter)?.label : "All Roles"}
                                                <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-44 p-0">
                                            <Command>
                                                <CommandInput placeholder="Search role..." />
                                                <CommandList>
                                                    <CommandEmpty>No role found.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem value="" onSelect={() => { setRoleFilter(""); setPagination(p => ({ ...p, page: 1 })); setRoleOpen(false); }}>
                                                            <Check className={cn("mr-2 h-3 w-3", roleFilter === "" ? "opacity-100" : "opacity-0")} />
                                                            All Roles
                                                        </CommandItem>
                                                        {roleOptions.map(role => (
                                                            <CommandItem key={role.value} value={role.value}
                                                                onSelect={(val) => { setRoleFilter(val === roleFilter ? "" : val); setPagination(p => ({ ...p, page: 1 })); setRoleOpen(false); }}
                                                            >
                                                                <Check className={cn("mr-2 h-3 w-3", roleFilter === role.value ? "opacity-100" : "opacity-0")} />
                                                                {role.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {roleFilter && (
                                        <Button variant="ghost" size="sm" onClick={clearFilters}
                                            className="w-full mt-2 gap-1 text-muted-foreground h-7 text-xs"
                                        >
                                            <X className="w-3 h-3" /> Clear
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <Button onClick={() => navigate("/users/new")} className="h-8 text-sm gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Add User
                    </Button>
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* ── Scrollable Table ── */}
            <div className="flex-1">
                <table className="w-full">
                    {/* Sticky table header */}
                    <thead className="relative sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
                        <tr className="border-b border-border">
                            {columns.map(({ label, col }) => (
                                <th key={col}
                                    className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                                    onClick={() => handleSort(col)}
                                >
                                    <div className="flex items-center gap-1">
                                        {label} {renderSortIcon(col)}
                                    </div>
                                </th>
                            ))}
                            <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="text-center py-16 text-sm text-muted-foreground">
                                    Loading users...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-16 text-sm text-muted-foreground">
                                    {searchQuery || roleFilter ? "No users found matching your search" : "No users found"}
                                </td>
                            </tr>
                        ) : users.map((user) => (
                            <tr key={user._id}
                                className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                                onClick={() => navigate(`/users/${user._id}`)}
                            >
                                <td className="py-3 px-4">
                                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getRoleBadge(user.role)}`}>
                                        {getRoleIcon(user.role)}
                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">{user.phone}</td>
                                <td className="py-3 px-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${user.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(user.createdAt)}</td>
                                <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                                    <div className="relative">
                                        <Button variant="ghost" size="icon" className="h-7 w-7"
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setMenuPosition({ top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right });
                                                setOpenActionId(openActionId === user._id ? null : user._id);
                                            }}
                                        >
                                            <MoreVertical className="w-3.5 h-3.5" />
                                        </Button>

                                        {openActionId === user._id && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setOpenActionId(null)} />
                                                <div style={{ position: "fixed", top: menuPosition.top, right: menuPosition.right }}
                                                    className="w-40 bg-card border border-border rounded-lg shadow-lg z-20 py-1"
                                                >
                                                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                                                        onClick={() => { navigate(`/users/${user._id}/edit`); setOpenActionId(null); }}
                                                    >
                                                        <Edit className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <div className="border-t border-border my-1" />
                                                    <button
                                                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${user._id === currentUser?._id ? "text-muted-foreground cursor-not-allowed" : "text-red-500 hover:bg-muted"}`}
                                                        disabled={user._id === currentUser?._id}
                                                        onClick={() => { if (user._id !== currentUser?._id) { handleDelete(user._id); setOpenActionId(null); } }}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Sticky Footer Pagination ── */}
            <div className="min-w-full flex items-center justify-between px-4 py-3 border-t border-border bg-background fixed bottom-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Show</span>
                    <select
                        value={pagination.limit}
                        onChange={e => setPagination(p => ({ ...p, limit: parseInt(e.target.value), page: 1 }))}
                        className="h-7 w-14 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                    >
                        {pageSizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {pagination.total > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </span>
                )}

                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        disabled={pagination.page === 1}
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) pageNum = i + 1;
                        else if (pagination.page <= 3) pageNum = i + 1;
                        else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
                        else pageNum = pagination.page - 2 + i;
                        return (
                            <Button key={pageNum}
                                variant={pagination.page === pageNum ? "default" : "outline"}
                                size="icon" className="h-7 w-7 text-xs"
                                onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                            >
                                {pageNum}
                            </Button>
                        );
                    })}
                    <Button variant="outline" size="icon" className="h-7 w-7"
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        disabled={pagination.page === pagination.pages}
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UserList;

// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Plus,
//   Search,
//   Edit,
//   Trash2,
//   ChevronLeft,
//   ChevronRight,
//   ChevronUp,
//   ChevronDown,
//   UserCog,
//   Wrench,
//   Filter,
//   X,
//   ShieldCheck,
//   Shield,
//   ClipboardList,
//   MoreVertical,
//   Check,
//   ChevronsUpDown,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import { cn } from "@/lib/utils";
// import userService from "@/api/userService";
// import { useAuth } from '@/context/AuthContext';

// const roleOptions = [
//   { value: "admin", label: "Admin" },
//   { value: "manager", label: "Manager" },
//   { value: "staff", label: "Staff" },
// ];

// const UserList = () => {
//   const navigate = useNavigate();

//   const { currentUser } = useAuth();
//   const [users, setUsers] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [searchOpen, setSearchOpen] = useState(false);

//   const [openActionId, setOpenActionId] = useState(null);
//   const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

//   const [searchQuery, setSearchQuery] = useState("");
//   const [roleFilter, setRoleFilter] = useState("");
//   const [roleOpen, setRoleOpen] = useState(false); // combobox open state
//   const [showFilters, setShowFilters] = useState(false);

//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: 10,
//     total: 0,
//     pages: 0,
//   });
//   const [sortBy, setSortBy] = useState("createdAt");
//   const [sortOrder, setSortOrder] = useState("desc");

//   const pageSizeOptions = [5, 10, 25, 50];

//   const fetchUsers = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const params = {
//         page: pagination.page,
//         limit: pagination.limit,
//         sortBy,
//         sortOrder,
//       };
//       if (searchQuery) params.search = searchQuery;
//       if (roleFilter) params.role = roleFilter;

//       const response = await userService.getUsers(params);
//       setUsers(response.data);
//       setPagination((prev) => ({
//         ...prev,
//         total: response.pagination.total,
//         pages: response.pagination.pages,
//       }));
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to fetch users");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, [pagination.page, pagination.limit, sortBy, sortOrder, roleFilter, searchQuery]);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setPagination((prev) => ({ ...prev, page: 1 }));
//     }, 500);
//     return () => clearTimeout(timer);
//   }, [searchQuery]);

//   const handleSort = (column) => {
//     if (sortBy === column) {
//       setSortOrder(sortOrder === "asc" ? "desc" : "asc");
//     } else {
//       setSortBy(column);
//       setSortOrder("asc");
//     }
//   };

//   const handleDelete = async (id) => {
//     if (id === currentUser?._id) {
//       alert("You cannot delete your own account");
//       return;
//     }
//     if (!window.confirm("Are you sure you want to delete this user?")) return;
//     try {
//       await userService.deleteUser(id);
//       fetchUsers();
//     } catch (err) {
//       alert(err.response?.data?.message || "Failed to delete user");
//     }
//   };

//   const handlePageChange = (newPage) =>
//     setPagination((prev) => ({ ...prev, page: newPage }));

//   const handlePageSizeChange = (e) => {
//     setPagination((prev) => ({
//       ...prev,
//       limit: parseInt(e.target.value),
//       page: 1,
//     }));
//   };

//   const clearFilters = () => {
//     setSearchQuery("");
//     setRoleFilter("");
//     setPagination((prev) => ({ ...prev, page: 1 }));
//   };

//   const renderSortIcon = (column) => {
//     if (sortBy !== column) return null;
//     return sortOrder === "asc" ? (
//       <ChevronUp className="w-4 h-4" />
//     ) : (
//       <ChevronDown className="w-4 h-4" />
//     );
//   };

//   const formatDate = (dateString) =>
//     new Date(dateString).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });

//   const getRoleIcon = (role) => {
//     switch (role) {
//       case "superadmin":
//         return <ShieldCheck className="w-4 h-4" />;
//       case "admin":
//         return <Shield className="w-4 h-4" />;
//       case "manager":
//         return <ClipboardList className="w-4 h-4" />;
//       case "staff":
//         return <Wrench className="w-4 h-4" />;
//       default:
//         return <UserCog className="w-4 h-4" />;
//     }
//   };

//   const getRoleBadgeColor = (role) => {
//     switch (role) {
//       case "superadmin":
//         return "bg-purple-100 text-purple-700";
//       case "admin":
//         return "bg-blue-100 text-blue-700";
//       case "manager":
//         return "bg-amber-100 text-amber-700";
//       case "staff":
//         return "bg-green-100 text-green-700";
//       default:
//         return "bg-gray-100 text-gray-700";
//     }
//   };

//   return (
//     <div className="space-y-6 p-4">
//       {/* Header */}
//       <div className="flex items-center justify-end gap-2">
//         {/* Search */}
//         <div className="flex items-center gap-2">
//           {searchOpen && (
//             <Input
//               autoFocus
//               type="text"
//               placeholder="Search users..."
//               value={searchQuery}
//               onChange={(e) => {
//                 setSearchQuery(e.target.value);
//                 setPagination((prev) => ({ ...prev, page: 1 }));
//               }}
//               className="w-56"
//             />
//           )}
//           <Button
//             variant="outline"
//             size="icon"
//             onClick={() => {
//               setSearchOpen((prev) => !prev);
//               if (searchOpen) {
//                 setSearchQuery("");
//                 setPagination((prev) => ({ ...prev, page: 1 }));
//               }
//             }}
//           >
//             {searchOpen ? (
//               <X className="w-4 h-4" />
//             ) : (
//               <Search className="w-4 h-4" />
//             )}
//           </Button>
//         </div>

//         {/* Filter */}
//         <div className="relative">
//           <Button
//             variant="outline"
//             size="icon"
//             onClick={() => setShowFilters(!showFilters)}
//           >
//             <Filter className="w-4 h-4" />
//             {roleFilter && (
//               <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">
//                 1
//               </span>
//             )}
//           </Button>

//           {showFilters && (
//             <>
//               <div
//                 className="fixed inset-0 z-10"
//                 onClick={() => setShowFilters(false)}
//               />
//               <div className="absolute right-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-56">
//                 <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
//                   Role
//                 </p>
//                 <Popover open={roleOpen} onOpenChange={setRoleOpen}>
//                   <PopoverTrigger asChild>
//                     <Button
//                       variant="outline"
//                       role="combobox"
//                       aria-expanded={roleOpen}
//                       className="w-full justify-between"
//                     >
//                       {roleFilter
//                         ? roleOptions.find((r) => r.value === roleFilter)?.label
//                         : "All Roles"}
//                       <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                     </Button>
//                   </PopoverTrigger>
//                   <PopoverContent className="w-44 p-0">
//                     <Command>
//                       <CommandInput placeholder="Search role..." />
//                       <CommandList>
//                         <CommandEmpty>No role found.</CommandEmpty>
//                         <CommandGroup>
//                           <CommandItem
//                             value=""
//                             onSelect={() => {
//                               setRoleFilter("");
//                               setPagination((prev) => ({ ...prev, page: 1 }));
//                               setRoleOpen(false);
//                             }}
//                           >
//                             <Check
//                               className={cn(
//                                 "mr-2 h-4 w-4",
//                                 roleFilter === "" ? "opacity-100" : "opacity-0",
//                               )}
//                             />
//                             All Roles
//                           </CommandItem>
//                           {roleOptions.map((role) => (
//                             <CommandItem
//                               key={role.value}
//                               value={role.value}
//                               onSelect={(val) => {
//                                 setRoleFilter(val === roleFilter ? "" : val);
//                                 setPagination((prev) => ({ ...prev, page: 1 }));
//                                 setRoleOpen(false);
//                               }}
//                             >
//                               <Check
//                                 className={cn(
//                                   "mr-2 h-4 w-4",
//                                   roleFilter === role.value
//                                     ? "opacity-100"
//                                     : "opacity-0",
//                                 )}
//                               />
//                               {role.label}
//                             </CommandItem>
//                           ))}
//                         </CommandGroup>
//                       </CommandList>
//                     </Command>
//                   </PopoverContent>
//                 </Popover>

//                 {roleFilter && (
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={clearFilters}
//                     className="w-full mt-2 gap-1 text-gray-500"
//                   >
//                     <X className="w-3 h-3" />
//                     Clear
//                   </Button>
//                 )}
//               </div>
//             </>
//           )}
//         </div>

//         {/* Add User */}
//         {!searchOpen && (
//           <Button onClick={() => navigate("/users/new")} className="gap-2">
//             <Plus className="w-4 h-4" />
//             Add User
//           </Button>
//         )}
//       </div>

//       {/* Error Message */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
//           {error}
//         </div>
//       )}

//       {/* Users Table */}
//       <Card className="shadow-sm">
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b border-gray-200 bg-gray-50">
//                   {[
//                     { label: "Name", col: "name" },
//                     { label: "Role", col: "role" },
//                     { label: "Email", col: "email" },
//                     { label: "Phone", col: "phone" },
//                     { label: "Status", col: "status" },
//                     { label: "Created", col: "createdAt" },
//                   ].map(({ label, col }) => (
//                     <th
//                       key={col}
//                       className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
//                       onClick={() => handleSort(col)}
//                     >
//                       <div className="flex items-center gap-1">
//                         {label}
//                         {renderSortIcon(col)}
//                       </div>
//                     </th>
//                   ))}
//                   {/* <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
//                     Status
//                   </th> */}
//                   <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {loading ? (
//                   <tr>
//                     <td colSpan="6" className="text-center py-8 text-gray-500">
//                       Loading users...
//                     </td>
//                   </tr>
//                 ) : users.length === 0 ? (
//                   <tr>
//                     <td colSpan="6" className="text-center py-8 text-gray-500">
//                       {searchQuery || roleFilter
//                         ? "No users found matching your search"
//                         : "No users found"}
//                     </td>
//                   </tr>
//                 ) : (
//                   users.map((user) => (
//                     <tr
//                       key={user._id}
//                       className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
//                       onClick={() => navigate(`/users/${user._id}`)}
//                     >
//                       <td className="py-3 px-4">
//                         <div className="font-medium text-gray-900">
//                           {user.name}
//                         </div>
//                         {user.isActive === false && (
//                           <span className="text-xs text-red-500">Inactive</span>
//                         )}
//                       </td>
//                       <td className="py-3 px-4">
//                         <span
//                           className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
//                         >
//                           {getRoleIcon(user.role)}
//                           {user.role.charAt(0).toUpperCase() +
//                             user.role.slice(1)}
//                         </span>
//                       </td>
//                       <td className="py-3 px-4 text-sm text-gray-600">
//                         {user.email}
//                       </td>
//                       <td className="py-3 px-4 text-sm text-gray-600">
//                         {user.phone}
//                       </td>
//                       <td className="py-3 px-4">
//                         <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.isActive
//                           ? 'bg-green-100 text-green-700'
//                           : 'bg-red-100 text-red-700'
//                           }`}>
//                           {user.isActive ? 'Active' : 'Inactive'}
//                         </span>
//                       </td>
//                       <td className="py-3 px-4 text-sm text-gray-600">
//                         {formatDate(user.createdAt)}
//                       </td>
//                       <td
//                         className="py-3 px-4"
//                         onClick={(e) => e.stopPropagation()}
//                       >
//                         <div className="relative">
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             onClick={(e) => {
//                               const rect =
//                                 e.currentTarget.getBoundingClientRect();
//                               setMenuPosition({
//                                 top: rect.bottom + window.scrollY,
//                                 right: window.innerWidth - rect.right,
//                               });
//                               setOpenActionId(
//                                 openActionId === user._id ? null : user._id,
//                               );
//                             }}
//                           >
//                             <MoreVertical className="w-4 h-4" />
//                           </Button>

//                           {openActionId === user._id && (
//                             <>
//                               <div
//                                 className="fixed inset-0 z-10"
//                                 onClick={() => setOpenActionId(null)}
//                               />
//                               <div
//                                 style={{
//                                   position: "fixed",
//                                   top: menuPosition.top,
//                                   right: menuPosition.right,
//                                 }}
//                                 className="w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1"
//                               >
//                                 <button
//                                   className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
//                                   onClick={() => {
//                                     navigate(`/users/${user._id}/edit`);
//                                     setOpenActionId(null);
//                                   }}
//                                 >
//                                   <Edit className="w-4 h-4" />
//                                   Edit
//                                 </button>
//                                 <div className="border-t border-gray-100 my-1" />
//                                 <button
//                                   className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${user._id === currentUser?._id
//                                     ? "text-gray-300 cursor-not-allowed"
//                                     : "text-red-600 hover:bg-red-50"
//                                     }`}
//                                   disabled={user._id === currentUser?._id}
//                                   onClick={() => {
//                                     if (user._id !== currentUser?._id) {
//                                       handleDelete(user._id);
//                                       setOpenActionId(null);
//                                     }
//                                   }}
//                                 >
//                                   <Trash2 className="w-4 h-4" />
//                                   Delete
//                                 </button>
//                               </div>
//                             </>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Pagination */}
//       <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//         <div className="flex items-center gap-2">
//           <span className="text-sm text-gray-600">Show</span>
//           <select
//             value={pagination.limit}
//             onChange={handlePageSizeChange}
//             className="h-9 w-20 rounded-md border border-input bg-background px-3 py-1 text-sm"
//           >
//             {pageSizeOptions.map((size) => (
//               <option key={size} value={size}>
//                 {size}
//               </option>
//             ))}
//           </select>
//           <span className="text-sm text-gray-600">entries</span>
//         </div>

//         <div className="flex items-center gap-2">
//           {pagination.total > 0 && (
//             <span className="text-sm text-gray-600">

//               Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
//               {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
//               {pagination.total} entries
//             </span>
//           )}
//         </div>

//         <div className="flex items-center gap-1">
//           <Button
//             variant="outline"
//             size="icon"
//             onClick={() => handlePageChange(pagination.page - 1)}
//             disabled={pagination.page === 1}
//           >
//             <ChevronLeft className="w-4 h-4" />
//           </Button>

//           {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
//             let pageNum;
//             if (pagination.pages <= 5) {
//               pageNum = i + 1;
//             } else if (pagination.page <= 3) {
//               pageNum = i + 1;
//             } else if (pagination.page >= pagination.pages - 2) {
//               pageNum = pagination.pages - 4 + i;
//             } else {
//               pageNum = pagination.page - 2 + i;
//             }
//             return (
//               <Button
//                 key={pageNum}
//                 variant={pagination.page === pageNum ? "default" : "outline"}
//                 size="icon"
//                 onClick={() => handlePageChange(pageNum)}
//               >
//                 {pageNum}
//               </Button>
//             );
//           })}

//           <Button
//             variant="outline"
//             size="icon"
//             onClick={() => handlePageChange(pagination.page + 1)}
//             disabled={pagination.page === pagination.pages}
//           >
//             <ChevronRight className="w-4 h-4" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserList;