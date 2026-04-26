import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  UserCog,
  Wrench,
  Filter,
  X,
  ShieldCheck,
  Shield,
  ClipboardList,
  MoreVertical,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import userService from "@/services/userService";
import axios from "axios";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
];

const UserList = () => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchOpen, setSearchOpen] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [openActionId, setOpenActionId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [roleOpen, setRoleOpen] = useState(false); // combobox open state
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const pageSizeOptions = [5, 10, 25, 50];

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("/api/auth/profile", {
          withCredentials: true,
        });
        setCurrentUser(response.data.data);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };
    fetchCurrentUser();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      };
      if (searchQuery) params.search = searchQuery;
      if (roleFilter) params.role = roleFilter;

      const response = await userService.getUsers(params);
      setUsers(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages,
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, sortBy, sortOrder, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u._id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedUsers.length} user(s)?`,
      )
    )
      return;
    try {
      setBulkActionLoading(true);
      for (const id of selectedUsers) {
        await userService.deleteUser(id);
      }
      setSelectedUsers([]);
      setSelectAll(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete users");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser?._id) {
      alert("You cannot delete your own account");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await userService.deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handlePageChange = (newPage) =>
    setPagination((prev) => ({ ...prev, page: newPage }));

  const handlePageSizeChange = (e) => {
    setPagination((prev) => ({
      ...prev,
      limit: parseInt(e.target.value),
      page: 1,
    }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const renderSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getRoleIcon = (role) => {
    switch (role) {
      case "superadmin":
        return <ShieldCheck className="w-4 h-4" />;
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "manager":
        return <ClipboardList className="w-4 h-4" />;
      case "staff":
        return <Wrench className="w-4 h-4" />;
      default:
        return <UserCog className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "superadmin":
        return "bg-purple-100 text-purple-700";
      case "admin":
        return "bg-blue-100 text-blue-700";
      case "manager":
        return "bg-amber-100 text-amber-700";
      case "staff":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end gap-2">
        {/* Search */}
        <div className="flex items-center gap-2">
          {searchOpen && (
            <Input
              autoFocus
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-56"
            />
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSearchOpen((prev) => !prev);
              if (searchOpen) {
                setSearchQuery("");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }
            }}
          >
            {searchOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Filter */}
        <div className="relative">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            {roleFilter && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">
                1
              </span>
            )}
          </Button>

          {showFilters && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowFilters(false)}
              />
              <div className="absolute right-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-56">
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                  Role
                </p>
                <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={roleOpen}
                      className="w-full justify-between"
                    >
                      {roleFilter
                        ? roleOptions.find((r) => r.value === roleFilter)?.label
                        : "All Roles"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-44 p-0">
                    <Command>
                      <CommandInput placeholder="Search role..." />
                      <CommandList>
                        <CommandEmpty>No role found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              setRoleFilter("");
                              setPagination((prev) => ({ ...prev, page: 1 }));
                              setRoleOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                roleFilter === "" ? "opacity-100" : "opacity-0",
                              )}
                            />
                            All Roles
                          </CommandItem>
                          {roleOptions.map((role) => (
                            <CommandItem
                              key={role.value}
                              value={role.value}
                              onSelect={(val) => {
                                setRoleFilter(val === roleFilter ? "" : val);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                                setRoleOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  roleFilter === role.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {role.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {roleFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full mt-2 gap-1 text-gray-500"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Add User */}
        {!searchOpen && (
          <Button onClick={() => navigate("/users/new")} className="gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <Card className="bg-primary/5 border-primary shadow-sm">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Users Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  {[
                    { label: "Name", col: "name" },
                    { label: "Role", col: "role" },
                    { label: "Email", col: "email" },
                    { label: "Phone", col: "phone" },
                    { label: "Created", col: "createdAt" },
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        selectedUsers.includes(user._id) ? "bg-primary/5" : ""
                      }`}
                      onClick={() => navigate(`/users/${user._id}`)}
                    >
                      <td
                        className="py-3 px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {user.name}
                        </div>
                        {user.isActive === false && (
                          <span className="text-xs text-red-500">Inactive</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                        >
                          {getRoleIcon(user.role)}
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.phone}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td
                        className="py-3 px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setMenuPosition({
                                top: rect.bottom + window.scrollY,
                                right: window.innerWidth - rect.right,
                              });
                              setOpenActionId(
                                openActionId === user._id ? null : user._id,
                              );
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>

                          {openActionId === user._id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenActionId(null)}
                              />
                              <div
                                style={{
                                  position: "fixed",
                                  top: menuPosition.top,
                                  right: menuPosition.right,
                                }}
                                className="w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1"
                              >
                                <button
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={() => {
                                    navigate(`/users/${user._id}/edit`);
                                    setOpenActionId(null);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                <div className="border-t border-gray-100 my-1" />
                                <button
                                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                                    user._id === currentUser?._id
                                      ? "text-gray-300 cursor-not-allowed"
                                      : "text-red-600 hover:bg-red-50"
                                  }`}
                                  disabled={user._id === currentUser?._id}
                                  onClick={() => {
                                    if (user._id !== currentUser?._id) {
                                      handleDelete(user._id);
                                      setOpenActionId(null);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={pagination.limit}
            onChange={handlePageSizeChange}
            className="h-9 w-20 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">entries</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} entries
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
            let pageNum;
            if (pagination.pages <= 5) {
              pageNum = i + 1;
            } else if (pagination.page <= 3) {
              pageNum = i + 1;
            } else if (pagination.page >= pagination.pages - 2) {
              pageNum = pagination.pages - 4 + i;
            } else {
              pageNum = pagination.page - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={pagination.page === pageNum ? "default" : "outline"}
                size="icon"
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserList;

// import { useState, useEffect, useContext } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Plus,
//   Search,
//   Edit,
//   Trash2,
//   Eye,
//   ChevronLeft,
//   ChevronRight,
//   ChevronUp,
//   ChevronDown,
//   UserCog,
//   Wrench,
//   Users,
//   Filter,
//   X,
//   Key,
//   ShieldCheck,
//   Shield,
//   ClipboardList,
//   MoreVertical,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import userService from "@/services/userService";
// import axios from "axios";

// const UserList = () => {
//   const navigate = useNavigate();

//   // State for current user (for self-deletion prevention)
//   const [currentUser, setCurrentUser] = useState(null);

//   // State for users data
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // State for selected users (bulk actions)
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [selectAll, setSelectAll] = useState(false);
//   const [openActionId, setOpenActionId] = useState(null);

//   // State for pagination
//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: 10,
//     total: 0,
//     pages: 0,
//   });

//   // State for sorting
//   const [sortBy, setSortBy] = useState("createdAt");
//   const [sortOrder, setSortOrder] = useState("desc");

//   // State for filters
//   const [searchQuery, setSearchQuery] = useState("");
//   const [roleFilter, setRoleFilter] = useState("");
//   const [showFilters, setShowFilters] = useState(false);

//   // State for bulk action loading
//   const [bulkActionLoading, setBulkActionLoading] = useState(false);

//   // Page size options
//   const pageSizeOptions = [5, 10, 25, 50];

//   // Fetch current user
//   useEffect(() => {
//     const fetchCurrentUser = async () => {
//       try {
//         const response = await axios.get("/api/auth/profile", {
//           withCredentials: true,
//         });
//         setCurrentUser(response.data.data);
//       } catch (err) {
//         console.error("Failed to fetch current user:", err);
//       }
//     };
//     fetchCurrentUser();
//   }, []);

//   // Fetch users
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

//   // Initial load
//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   // Re-fetch when pagination, sort, or filter changes
//   useEffect(() => {
//     fetchUsers();
//   }, [pagination.page, pagination.limit, sortBy, sortOrder, roleFilter]);

//   // Debounced search
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (searchQuery) {
//         setPagination((prev) => ({ ...prev, page: 1 }));
//       }
//     }, 500);

//     return () => clearTimeout(timer);
//   }, [searchQuery]);

//   // Handle sort
//   const handleSort = (column) => {
//     if (sortBy === column) {
//       setSortOrder(sortOrder === "asc" ? "desc" : "asc");
//     } else {
//       setSortBy(column);
//       setSortOrder("asc");
//     }
//   };

//   // Handle select all
//   const handleSelectAll = () => {
//     if (selectAll) {
//       setSelectedUsers([]);
//     } else {
//       setSelectedUsers(users.map((u) => u._id));
//     }
//     setSelectAll(!selectAll);
//   };

//   // Handle individual selection
//   const handleSelectUser = (id) => {
//     setSelectedUsers((prev) => {
//       if (prev.includes(id)) {
//         return prev.filter((u) => u !== id);
//       } else {
//         return [...prev, id];
//       }
//     });
//   };

//   // Handle bulk delete
//   const handleBulkDelete = async () => {
//     if (
//       !window.confirm(
//         `Are you sure you want to delete ${selectedUsers.length} user(s)?`,
//       )
//     ) {
//       return;
//     }

//     try {
//       setBulkActionLoading(true);
//       for (const id of selectedUsers) {
//         await userService.deleteUser(id);
//       }
//       setSelectedUsers([]);
//       setSelectAll(false);
//       fetchUsers();
//     } catch (err) {
//       alert(err.response?.data?.message || "Failed to delete users");
//     } finally {
//       setBulkActionLoading(false);
//     }
//   };

//   // Handle delete single user (with self-deletion prevention)
//   const handleDelete = async (id) => {
//     // Prevent self-deletion
//     if (id === currentUser?._id) {
//       alert("You cannot delete your own account");
//       return;
//     }

//     if (!window.confirm("Are you sure you want to delete this user?")) {
//       return;
//     }

//     try {
//       await userService.deleteUser(id);
//       fetchUsers();
//     } catch (err) {
//       alert(err.response?.data?.message || "Failed to delete user");
//     }
//   };

//   // Handle page change
//   const handlePageChange = (newPage) => {
//     setPagination((prev) => ({ ...prev, page: newPage }));
//   };

//   // Handle page size change
//   const handlePageSizeChange = (e) => {
//     setPagination((prev) => ({
//       ...prev,
//       limit: parseInt(e.target.value),
//       page: 1,
//     }));
//   };

//   // Clear filters
//   const clearFilters = () => {
//     setSearchQuery("");
//     setRoleFilter("");
//     setPagination((prev) => ({ ...prev, page: 1 }));
//   };

//   // Render sort icon
//   const renderSortIcon = (column) => {
//     if (sortBy !== column) return null;
//     return sortOrder === "asc" ? (
//       <ChevronUp className="w-4 h-4" />
//     ) : (
//       <ChevronDown className="w-4 h-4" />
//     );
//   };

//   // Format date
//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   // Get role icon
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

//   // Get role badge color
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
//     <div className="space-y-6">
//       {/* Page Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Users</h1>
//           <p className="text-gray-600 mt-1">
//             Manage user accounts and permissions
//           </p>
//         </div>
//         <Button onClick={() => navigate("/users/new")} className="gap-2">
//           <Plus className="w-4 h-4" />
//           Add User
//         </Button>
//       </div>

//       {/* Search and Filter Bar */}
//       <Card className="shadow-sm">
//         <CardContent className="pt-6">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//               <Input
//                 type="text"
//                 placeholder="Search users..."
//                 value={searchQuery}
//                 onChange={(e) => {
//                   setSearchQuery(e.target.value);
//                   setPagination((prev) => ({ ...prev, page: 1 }));
//                 }}
//                 className="pl-10"
//               />
//             </div>
//             <Button
//               variant="outline"
//               onClick={() => setShowFilters(!showFilters)}
//               className="gap-2"
//             >
//               <Filter className="w-4 h-4" />
//               Filters
//               {roleFilter && (
//                 <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
//                   1
//                 </span>
//               )}
//             </Button>
//           </div>

//           {/* Filter Options */}
//           {showFilters && (
//             <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
//               <div className="flex flex-wrap gap-4 items-center">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Role
//                   </label>
//                   <select
//                     value={roleFilter}
//                     onChange={(e) => {
//                       setRoleFilter(e.target.value);
//                       setPagination((prev) => ({ ...prev, page: 1 }));
//                     }}
//                     className="h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm"
//                   >
//                     <option value="">All Roles</option>
//                     <option value="admin">Admin</option>
//                     <option value="manager">Manager</option>
//                     <option value="staff">Staff</option>
//                   </select>
//                 </div>
//                 <Button
//                   variant="ghost"
//                   onClick={clearFilters}
//                   className="gap-1"
//                 >
//                   <X className="w-4 h-4" />
//                   Clear Filters
//                 </Button>
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Bulk Actions Bar */}
//       {selectedUsers.length > 0 && (
//         <Card className="bg-primary/5 border-primary shadow-sm">
//           <CardContent className="py-3 flex items-center justify-between">
//             <span className="text-sm font-medium">
//               {selectedUsers.length} user(s) selected
//             </span>
//             <div className="flex gap-2">
//               <Button
//                 variant="destructive"
//                 size="sm"
//                 onClick={handleBulkDelete}
//                 disabled={bulkActionLoading}
//                 className="gap-1"
//               >
//                 <Trash2 className="w-4 h-4" />
//                 Delete Selected
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       )}

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
//                   <th className="text-left py-3 px-4">
//                     <input
//                       type="checkbox"
//                       checked={selectAll}
//                       onChange={handleSelectAll}
//                       className="w-4 h-4 rounded border-gray-300"
//                     />
//                   </th>
//                   <th
//                     className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
//                     onClick={() => handleSort("name")}
//                   >
//                     <div className="flex items-center gap-1">
//                       Name
//                       {renderSortIcon("name")}
//                     </div>
//                   </th>
//                   <th
//                     className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
//                     onClick={() => handleSort("role")}
//                   >
//                     <div className="flex items-center gap-1">
//                       Role
//                       {renderSortIcon("role")}
//                     </div>
//                   </th>
//                   <th
//                     className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
//                     onClick={() => handleSort("email")}
//                   >
//                     <div className="flex items-center gap-1">
//                       Email
//                       {renderSortIcon("email")}
//                     </div>
//                   </th>
//                   <th
//                     className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
//                     onClick={() => handleSort("phone")}
//                   >
//                     <div className="flex items-center gap-1">
//                       Phone
//                       {renderSortIcon("phone")}
//                     </div>
//                   </th>
//                   <th
//                     className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
//                     onClick={() => handleSort("createdAt")}
//                   >
//                     <div className="flex items-center gap-1">
//                       Created
//                       {renderSortIcon("createdAt")}
//                     </div>
//                   </th>
//                   <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {loading ? (
//                   <tr>
//                     <td colSpan="8" className="text-center py-8 text-gray-500">
//                       Loading users...
//                     </td>
//                   </tr>
//                 ) : users.length === 0 ? (
//                   <tr>
//                     <td colSpan="8" className="text-center py-8 text-gray-500">
//                       No users found
//                     </td>
//                   </tr>
//                 ) : (
//                   users.map((user) => (
//                     <tr
//                       key={user._id}
//                       className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
//                         selectedUsers.includes(user._id) ? "bg-primary/5" : ""
//                       }`}
//                       onClick={() => navigate(`/users/${user._id}`)}
//                     >
//                       <td className="py-3 px-4">
//                         <input
//                           type="checkbox"
//                           checked={selectedUsers.includes(user._id)}
//                           onChange={() => handleSelectUser(user._id)}
//                           className="w-4 h-4 rounded border-gray-300"
//                         />
//                       </td>
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
//                             onClick={() =>
//                               setOpenActionId(
//                                 openActionId === user._id ? null : user._id,
//                               )
//                             }
//                           >
//                             <MoreVertical className="w-4 h-4" />
//                           </Button>

//                           {openActionId === user._id && (
//                             <>
//                               <div
//                                 className="fixed inset-0 z-999999"
//                                 onClick={() => setOpenActionId(null)}
//                               />
//                               <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
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
//                                   className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
//                                     user._id === currentUser?._id
//                                       ? "text-gray-300 cursor-not-allowed"
//                                       : "text-red-600 hover:bg-red-50"
//                                   }`}
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
//       <div className="fixed flex flex-col md:flex-row items-center justify-between gap-4">
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
//           <span className="text-sm text-gray-600">
//             Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
//             {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
//             {pagination.total} entries
//           </span>
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
