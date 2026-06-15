import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  UserCog,
  Wrench,
  ShieldCheck,
  Shield,
  ClipboardList,
  Check,
  ChevronsUpDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/context/AuthContext";
import userService from "@/api/userService";
import toast from "react-hot-toast";
import FilterPopover from "@/components/common/FilterPopover";
import PageHeader from "@/components/common/PageHeader";
import TableFooter from "@/components/common/TableFooter";
import RowActions from "@/components/common/RowActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
];

const getRoleIcon = (role) => {
  switch (role) {
    case "superadmin":
      return <ShieldCheck className="w-3 h-3" />;
    case "admin":
      return <Shield className="w-3 h-3" />;
    case "manager":
      return <ClipboardList className="w-3 h-3" />;
    case "staff":
      return <Wrench className="w-3 h-3" />;
    default:
      return <UserCog className="w-3 h-3" />;
  }
};

const getRoleBadge = (role) => {
  switch (role) {
    case "superadmin":
      return "bg-purple-500/10 text-purple-500";
    case "admin":
      return "bg-blue-500/10 text-blue-500";
    case "manager":
      return "bg-amber-500/10 text-amber-500";
    case "staff":
      return "bg-green-500/10 text-green-500";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const columns = [
  { label: "Name", col: "name" },
  { label: "Role", col: "role" },
  { label: "Email", col: "email" },
  { label: "Phone", col: "phone" },
  { label: "Status", col: "status" },
  { label: "Created", col: "createdAt" },
];

const UserList = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    userId: null,
  });

  const fetchUsers = useCallback(async () => {
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
  }, [
    pagination.page,
    pagination.limit,
    sortBy,
    sortOrder,
    roleFilter,
    searchQuery,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(
      () => setPagination((prev) => ({ ...prev, page: 1 })),
      500,
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSort = (column) => {
    if (sortBy === column) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleDelete = async () => {
    try {
      await userService.deleteUser(confirmDialog.userId);
      toast.success("User deleted");
      setConfirmDialog({ open: false, userId: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const clearFilters = () => {
    setRoleFilter("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const renderSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // Filter panel rendered as children of PageHeader
  const filterPanel = (
    <FilterPopover
      open={showFilters}
      onClose={() => setShowFilters(false)}
      onClear={clearFilters}
      hasFilters={!!roleFilter}
    >
      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
        Role
      </p>
      <Popover open={roleOpen} onOpenChange={setRoleOpen}>
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowFilters(false)}
        />
        <div className="absolute right-0 mt-2 p-3 bg-card border border-border rounded-lg shadow-lg z-20 w-52">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Role
          </p>
          <Popover open={roleOpen} onOpenChange={setRoleOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-8 text-sm"
              >
                {roleFilter
                  ? roleOptions.find((r) => r.value === roleFilter)?.label
                  : "All Roles"}
                <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
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
                        setPagination((p) => ({ ...p, page: 1 }));
                        setRoleOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3 w-3",
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
                          setPagination((p) => ({ ...p, page: 1 }));
                          setRoleOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3 w-3",
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
              className="w-full mt-2 gap-1 text-muted-foreground h-7 text-xs"
            >
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
      </Popover>
    </FilterPopover>
  );

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 48px)" }}>
      <PageHeader
        title="Users"
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        onSearchToggle={() => {
          setSearchOpen((p) => !p);
          if (searchOpen) setSearchQuery("");
        }}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        onAddNew={() => navigate("/app/users/new")}
        addLabel="Add User"
        filterCount={roleFilter ? 1 : 0}
        onFilterToggle={() => setShowFilters((p) => !p)}
      >
        {filterPanel}
      </PageHeader>

      {error && (
        <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
            <tr className="border-b border-border">
              {columns.map(({ label, col }) => (
                <th
                  key={col}
                  className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-1">
                    {label} {renderSortIcon(col)}
                  </div>
                </th>
              ))}
              <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-16 text-sm text-muted-foreground"
                >
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-16 text-sm text-muted-foreground"
                >
                  {searchQuery || roleFilter
                    ? "No users found matching your search"
                    : "No users found"}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => navigate(`/app/users/${user._id}`)}
                >
                  <td className="py-1 px-4 text-sm font-medium text-foreground">
                    {user.name}
                  </td>
                  <td className="py-1 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getRoleBadge(user.role)}`}
                    >
                      {getRoleIcon(user.role)}
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="py-1 px-4 text-sm text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="py-1 px-4 text-sm text-muted-foreground">
                    {user.phone}
                  </td>
                  <td className="py-1 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${user.isActive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-1 px-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-1 px-4">
                    <RowActions
                      actions={[
                        {
                          label: "Edit",
                          icon: Edit,
                          onClick: () => navigate(`/app/users/${user._id}/edit`),
                        },
                        {
                          label: "Delete",
                          icon: Trash2,
                          danger: true,
                          divider: true,
                          disabled: user._id === currentUser?._id,
                          onClick: () =>
                            setConfirmDialog({ open: true, userId: user._id }),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex-1 overflow-y-auto divide-y divide-border">
        {loading ? (
          <p className="text-center py-16 text-sm text-muted-foreground">
            Loading users...
          </p>
        ) : users.length === 0 ? (
          <p className="text-center py-16 text-sm text-muted-foreground">
            No users found
          </p>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              onClick={() => navigate(`/app/users/${user._id}`)}
              className="px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">{user.phone}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium ${getRoleBadge(user.role)}`}
                >
                  {user.role}
                </span>
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium ${user.isActive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <TableFooter
        pagination={pagination}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onLimitChange={(limit) =>
          setPagination((p) => ({ ...p, limit, page: 1 }))
        }
      />
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, userId: null })}
        onConfirm={handleDelete}
        title="Delete User"
        description="This action cannot be undone. The user will be permanently removed."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default UserList;