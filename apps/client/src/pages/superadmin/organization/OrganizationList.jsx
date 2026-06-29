import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import organizationService from "@/api/organizationService";
import toast from "react-hot-toast";
import PageHeader from "@/components/common/PageHeader";
import TableFooter from "@/components/common/TableFooter";

const columns = [
  { label: "Name", col: "name" },
  { label: "Contact Email", col: "contactEmail" },
  { label: "Contact Phone", col: "contactPhone" },
  { label: "Status", col: "status" },
  { label: "Created", col: "createdAt" },
];

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const OrganizationList = () => {
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: pagination.limit };
      if (searchQuery) params.search = searchQuery;
      const response = await organizationService.getOrganizations(params);
      setOrganizations(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages,
      }));
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || "Failed to fetch organizations");
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    const timer = setTimeout(
      () => setPagination((prev) => ({ ...prev, page: 1 })),
      500
    );
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 48px)" }}>
      <PageHeader
        title="Organizations"
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
        onAddNew={() => navigate("/app/organizations/new")}
        addLabel="Add Organization"
      />

      {/* Desktop Table */}
      <div className="hidden md:block flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
            <tr className="border-b border-border">
              {columns.map(({ label, col }) => (
                <th
                  key={col}
                  className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-16 text-sm text-muted-foreground">
                  Loading organizations...
                </td>
              </tr>
            ) : organizations.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-16 text-sm text-muted-foreground">
                  {searchQuery ? "No organizations found matching your search" : "No organizations found"}
                </td>
              </tr>
            ) : (
              organizations.map((org) => (
                <tr key={org._id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="py-1 px-4 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {org.name}
                    </div>
                  </td>
                  <td className="py-1 px-4 text-sm text-muted-foreground">{org.contactEmail || "—"}</td>
                  <td className="py-1 px-4 text-sm text-muted-foreground">{org.contactPhone || "—"}</td>
                  <td className="py-1 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${org.isActive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {org.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-1 px-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(org.createdAt)}
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
          <p className="text-center py-16 text-sm text-muted-foreground">Loading organizations...</p>
        ) : organizations.length === 0 ? (
          <p className="text-center py-16 text-sm text-muted-foreground">No organizations found</p>
        ) : (
          organizations.map((org) => (
            <div key={org._id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{org.name}</p>
                <p className="text-xs text-muted-foreground">{org.contactEmail || "—"}</p>
                <p className="text-xs text-muted-foreground">{org.contactPhone || "—"}</p>
              </div>
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${org.isActive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                {org.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          ))
        )}
      </div>

      <TableFooter
        pagination={pagination}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onLimitChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
      />
    </div>
  );
};

export default OrganizationList;