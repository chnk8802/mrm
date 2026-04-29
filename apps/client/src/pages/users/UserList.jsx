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
import { useAuth } from '@/context/AuthContext';

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
];

const UserList = () => {
  const navigate = useNavigate();

  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchOpen, setSearchOpen] = useState(false);

  const [openActionId, setOpenActionId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [roleOpen, setRoleOpen] = useState(false); // combobox open state
  const [showFilters, setShowFilters] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const pageSizeOptions = [5, 10, 25, 50];

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
  }, [pagination.page, pagination.limit, sortBy, sortOrder, roleFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
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
                  {[
                    { label: "Name", col: "name" },
                    { label: "Role", col: "role" },
                    { label: "Email", col: "email" },
                    { label: "Phone", col: "phone" },
                    { label: "Status", col: "status" },
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
                  {/* <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Status
                  </th> */}
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      {searchQuery || roleFilter
                        ? "No users found matching your search"
                        : "No users found"}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/users/${user._id}`)}
                    >
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
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                          }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
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
                                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${user._id === currentUser?._id
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
          {pagination.total > 0 && (
            <span className="text-sm text-gray-600">

              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} entries
            </span>
          )}
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