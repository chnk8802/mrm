import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PackageCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import repairService from "@/api/repairService";
import PageHeader from "@/components/common/PageHeader";
import TableFooter from "@/components/common/TableFooter";
import RowActions from "@/components/common/RowActions";
import FilterPopover from "@/components/common/FilterPopover";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermission } from "@/hooks/usePermission";
import { AsyncCombobox } from "@/components/common/AsyncComboBox";
import FilterSelect from "@/components/common/FilterSelect";
import customerService from "@/api/customerService";
import userService from "@/api/userService";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import technicianService from "@/api/technicianService";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "received", label: "Received" },
  { value: "in-progress", label: "In Progress" },
  { value: "ready", label: "Ready" },
  { value: "not-repairable", label: "Not Repairable" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "waived", label: "Waived" },
];

const PICKED_UP_OPTIONS = [
  { value: "true", label: "Picked Up" },
  { value: "false", label: "Not Picked Up" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Mirrors the backend deleteRepair rules. Keep both in sync if either changes.
const canDeleteRepair = (r) =>
  r.status !== "completed" &&
  !r.isPickedUp &&
  !(r.amountPaid > 0) &&
  r.paymentStatus !== "paid" &&
  (r.sparePartUsage?.length ?? 0) === 0;

const fetchTechnicians = async (search) => {
  const res = await technicianService.getTechnicians({ search });
  return (res.data || []).map((t) => ({ value: t._id, label: t.name }));
};

const fetchCustomersForFilter = async (search) => {
  const res = await customerService.getCustomers({ search, limit: 5 });
  return (res.data || []).map((c) => ({
    value: c._id,
    label: `${c.name} — ${c.phone || c.email || ""}`,
  }));
};
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

const getStatusBadge = (status) => {
  switch (status) {
    case "received":
      return {
        icon: Clock,
        color: "bg-yellow-500/10 text-yellow-500",
        label: "Received",
      };
    case "in-progress":
      return {
        icon: Wrench,
        color: "bg-blue-500/10 text-blue-500",
        label: "In Progress",
      };
    case "ready":
      return {
        icon: PackageCheck,
        color: "bg-purple-500/10 text-purple-500",
        label: "Ready",
      };
    case "not-repairable":
      return {
        icon: AlertCircle,
        color: "bg-orange-500/10 text-orange-500",
        label: "Not Repairable",
      };
    case "completed":
      return {
        icon: CheckCircle,
        color: "bg-green-500/10 text-green-500",
        label: "Completed",
      };
    case "cancelled":
      return {
        icon: XCircle,
        color: "bg-red-500/10 text-red-500",
        label: "Cancelled",
      };
    default:
      return {
        icon: AlertCircle,
        color: "bg-muted text-muted-foreground",
        label: status,
      };
  }
};

const getPaymentStatusBadge = (paymentStatus) => {
  switch (paymentStatus) {
    case "unpaid":
      return { color: "bg-red-500/10 text-red-500", label: "Unpaid" };
    case "partial":
      return { color: "bg-yellow-500/10 text-yellow-500", label: "Partial" };
    case "paid":
      return { color: "bg-green-500/10 text-green-500", label: "Paid" };
    case "waived":
      return { color: "bg-muted text-muted-foreground", label: "Waived" };
    default:
      return { color: "bg-muted text-muted-foreground", label: paymentStatus };
  }
};

const getPickupBadge = (isPickedUp) =>
  isPickedUp
    ? { color: "bg-green-500/10 text-green-500", label: "Picked Up" }
    : {
        color: "bg-muted text-muted-foreground",
        label: "Not Picked Up",
      };

// ─── RepairList ───────────────────────────────────────────────────────────────

const RepairList = () => {
  useDocumentTitle('Repairs');
  const navigate = useNavigate();
  const { hasRole } = usePermission();

  // ── All filters live in the URL so dashboard deep-links (e.g. ?status=ready)
  //    and this page's own filter UI always stay in sync, in both directions.
  const [searchParams, setSearchParams] = useSearchParams();

  const setParam = (key, val) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) next.set(key, val);
      else next.delete(key);
      return next;
    });
  };

  const statusFilter = searchParams.get("status") || "";
  const paymentStatusFilter = searchParams.get("paymentStatus") || "";
  const pickedUpFilter = searchParams.get("isPickedUp") || "";
  const technicianFilter = searchParams.get("technician") || "";
  const customerFilter = searchParams.get("customer") || "";

  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRepairs, setSelectedRepairs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    label: "",
  });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  const columns = [
    { label: "Repair ID", col: "repairId" },
    { label: "Device", col: "deviceModel" },
    { label: "Customer", col: null },
    ...(hasRole("superadmin") ? [{ label: "Organization", col: null }] : []),
    { label: "Status", col: "status" },
    { label: "Problem", col: "problem" },
    ...(hasRole("manager") ? [{ label: "Charge", col: "serviceCharge" }] : []),
    { label: "Created", col: "createdAt" },
  ];

  const tableColSpan =
    (hasRole("admin") ? 1 : 0) + columns.length + (hasRole("manager") ? 1 : 0);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchRepairs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
      if (pickedUpFilter) params.isPickedUp = pickedUpFilter;
      if (technicianFilter) params.technician = technicianFilter;
      if (customerFilter) params.customer = customerFilter;

      const response = await repairService.getRepairs(params);
      setRepairs(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages,
      }));
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors?.length) toast.error(errorData.errors[0].message);
      else toast.error(errorData?.message || "Failed to fetch repair");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    sortBy,
    sortOrder,
    statusFilter,
    paymentStatusFilter,
    pickedUpFilter,
    technicianFilter,
    customerFilter,
    searchQuery,
  ]);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  useEffect(() => {
    const t = setTimeout(() => setPagination((p) => ({ ...p, page: 1 })), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Sort ──────────────────────────────────────────────────────────────────

  const handleSort = (col) => {
    if (!col) return;
    if (sortBy === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (col) => {
    if (!col || sortBy !== col) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  // ── Selection ─────────────────────────────────────────────────────────────

  // Select-all only picks rows that can actually be deleted
  const handleSelectAll = () => {
    setSelectedRepairs(
      selectAll ? [] : repairs.filter(canDeleteRepair).map((r) => r._id),
    );
    setSelectAll((p) => !p);
  };

  const handleSelectRepair = (id) =>
    setSelectedRepairs((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    try {
      await repairService.deleteRepair(deleteDialog.id);
      toast.success("Repair deleted");
      setDeleteDialog({ open: false, id: null, label: "" });
      fetchRepairs();
    } catch (err) {
      const errorData = err.response?.data;

      if (
        errorData?.errors &&
        Array.isArray(errorData.errors) &&
        errorData.errors.length > 0
      ) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || "Failed to delete repair");
      }
    }
  };

  // Sequential on purpose: parallel deletes for the same customer can hit
  // transaction write conflicts, and one failure shouldn't hide the others.
  const handleBulkDelete = async () => {
    let ok = 0;
    let failed = 0;
    let lastMessage = "";

    for (const id of selectedRepairs) {
      try {
        await repairService.deleteRepair(id);
        ok++;
      } catch (err) {
        failed++;
        lastMessage = err.response?.data?.message || "";
      }
    }

    if (ok) toast.success(`${ok} repair${ok !== 1 ? "s" : ""} deleted`);
    if (failed)
      toast.error(
        `${failed} could not be deleted${lastMessage ? `: ${lastMessage}` : ""}`,
      );

    setSelectedRepairs([]);
    setSelectAll(false);
    setBulkDeleteDialog(false);
    fetchRepairs();
  };

  const clearFilters = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      ["status", "paymentStatus", "isPickedUp", "technician", "customer"].forEach((k) =>
        next.delete(k),
      );
      return next;
    });
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const filterCount = [
    statusFilter,
    paymentStatusFilter,
    pickedUpFilter,
    technicianFilter,
    customerFilter,
  ].filter(Boolean).length;

  // ── Row actions (shared by desktop and mobile) ────────────────────────────

  const buildActions = (repair) => [
    {
      label: "Edit",
      icon: Edit,
      onClick: () => navigate(`/app/repairs/${repair._id}/edit`),
    },
    ...(hasRole("admin") && canDeleteRepair(repair)
      ? [
          {
            label: "Delete",
            icon: Trash2,
            danger: true,
            divider: true,
            onClick: () =>
              setDeleteDialog({
                open: true,
                id: repair._id,
                label: repair.repairId,
              }),
          },
        ]
      : []),
  ];

  // ── Filter panel ──────────────────────────────────────────────────────────
  const filterPanel = (
    <FilterPopover
      open={showFilters}
      onClose={() => setShowFilters(false)}
      onClear={clearFilters}
      hasFilters={filterCount > 0}
    >
      <FilterSelect
        label="Status"
        value={statusFilter}
        onChange={(val) => {
          setParam("status", val);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        options={STATUS_OPTIONS}
        allLabel="All Statuses"
      />
      <FilterSelect
        label="Payment Status"
        value={paymentStatusFilter}
        onChange={(val) => {
          setParam("paymentStatus", val);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        options={PAYMENT_STATUS_OPTIONS}
        allLabel="All Payment Statuses"
      />
      <FilterSelect
        label="Pickup"
        value={pickedUpFilter}
        onChange={(val) => {
          setParam("isPickedUp", val);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        options={PICKED_UP_OPTIONS}
        allLabel="All"
      />
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Technician
        </p>
        <div className="flex items-center gap-1">
          <AsyncCombobox
            value={technicianFilter}
            onChange={(val) => {
              setParam("technician", val);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            fetchOptions={fetchTechnicians}
            placeholder="Search technician..."
          />
          {technicianFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => {
                setParam("technician", "");
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          Customer
        </p>
        <div className="flex items-center gap-1">
          <AsyncCombobox
            value={customerFilter}
            onChange={(val) => {
              setParam("customer", val);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            fetchOptions={fetchCustomersForFilter}
            placeholder="Search customer..."
          />
          {customerFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => {
                setParam("customer", "");
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </FilterPopover>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 48px)" }}>
      {/* ── Header ── */}
      {selectedRepairs.length > 0 ? (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
          <span className="text-sm text-muted-foreground">
            {selectedRepairs.length} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-sm"
            onClick={() => setBulkDeleteDialog(true)}
          >
            Delete Selected
          </Button>
        </div>
      ) : (
        <PageHeader
          title="Repairs"
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
          {...(hasRole("manager")
            ? {
                onAddNew: () => navigate("/app/repairs/new"),
                addLabel: "New Repair",
              }
            : {})}
          filterCount={filterCount}
          onFilterToggle={() => setShowFilters((p) => !p)}
        >
          {filterPanel}
        </PageHeader>
      )}

      {/* ── Desktop Table ── */}
      <div className="hidden md:block flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
            <tr className="border-b border-border">
              {hasRole("admin") && (
                <th className="py-2.5 px-4 w-10">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map(({ label, col }) => (
                <th
                  key={label}
                  className={`text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap ${col ? "cursor-pointer hover:text-foreground transition-colors" : ""}`}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {renderSortIcon(col)}
                  </div>
                </th>
              ))}
              {hasRole("manager") && (
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={tableColSpan}
                  className="text-center py-16 text-sm text-muted-foreground"
                >
                  Loading repairs...
                </td>
              </tr>
            ) : repairs.length === 0 ? (
              <tr>
                <td
                  colSpan={tableColSpan}
                  className="text-center py-16 text-sm text-muted-foreground"
                >
                  <Wrench className="mx-auto w-8 h-8 mb-2 opacity-30" />
                  {searchQuery || statusFilter
                    ? "No repairs found matching your filters"
                    : "No repairs yet"}
                </td>
              </tr>
            ) : (
              repairs.map((repair) => {
                const {
                  icon: Icon,
                  color,
                  label,
                } = getStatusBadge(repair.status);
                return (
                  <tr
                    key={repair._id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => navigate(`/app/repairs/${repair._id}`)}
                  >
                    {hasRole("admin") && (
                      <td
                        className="py-1 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canDeleteRepair(repair) && (
                          <Checkbox
                            checked={selectedRepairs.includes(repair._id)}
                            onCheckedChange={() =>
                              handleSelectRepair(repair._id)
                            }
                          />
                        )}
                      </td>
                    )}
                    <td className="py-1 px-4 text-sm font-medium text-foreground">
                      {repair.repairId}
                    </td>
                    <td className="py-1 px-4">
                      <p className="text-sm font-medium text-foreground">
                        {repair.deviceModel}
                      </p>
                      {repair.imei && (
                        <p className="text-xs text-muted-foreground">
                          {repair.imei}
                        </p>
                      )}
                    </td>
                    <td className="py-1 px-4">
                      <p className="text-sm text-foreground">
                        {repair.customer?.name || "—"}
                      </p>
                      {repair.customer?.phone && (
                        <p className="text-xs text-muted-foreground">
                          {repair.customer.phone}
                        </p>
                      )}
                    </td>
                    {hasRole("superadmin") && (
                      <td className="py-1 px-4">
                        <span className="text-xs font-medium text-purple-500">
                          {repair.orgId?.name || "—"}
                        </span>
                      </td>
                    )}
                    <td className="py-1 px-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium w-fit ${color}`}
                        >
                          <Icon className="w-3 h-3" />
                          {label}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium w-fit ${getPaymentStatusBadge(repair.paymentStatus).color}`}
                          >
                            {getPaymentStatusBadge(repair.paymentStatus).label}
                          </span>
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium w-fit ${getPickupBadge(repair.isPickedUp).color}`}
                          >
                            {getPickupBadge(repair.isPickedUp).label}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-1 px-4">
                      {repair?.problem && (
                        <p className="text-xs text-muted-foreground">
                          {repair.problem}
                        </p>
                      )}
                    </td>
                    {hasRole("manager") && (
                      <td className="py-1 px-4 text-sm text-foreground font-medium">
                        {formatCurrency(repair.serviceCharge)}
                        {repair.discount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            -{formatCurrency(repair.discount)}
                          </p>
                        )}
                      </td>
                    )}
                    <td className="py-1 px-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(repair.createdAt)}
                    </td>
                    {hasRole("manager") && (
                      <td
                        className="py-1 px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RowActions actions={buildActions(repair)} />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="md:hidden flex-1 overflow-y-auto divide-y divide-border">
        {loading ? (
          <p className="text-center py-16 text-sm text-muted-foreground">
            Loading repairs...
          </p>
        ) : repairs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Wrench className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">
              {searchQuery || statusFilter
                ? "No repairs found"
                : "No repairs yet"}
            </p>
          </div>
        ) : (
          repairs.map((repair) => {
            const { icon: Icon, color, label } = getStatusBadge(repair.status);
            return (
              <div
                key={repair._id}
                onClick={() => navigate(`/app/repairs/${repair._id}`)}
                className="px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors flex items-center gap-3"
              >
                {/* Checkbox */}
                {hasRole("admin") && canDeleteRepair(repair) && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  >
                    <Checkbox
                      checked={selectedRepairs.includes(repair._id)}
                      onCheckedChange={() => handleSelectRepair(repair._id)}
                    />
                  </div>
                )}

                {/* Left */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {repair.repairId}
                  </p>
                  {hasRole("superadmin") && (
                    <p className="text-xs font-medium text-purple-500">
                      {repair.orgId?.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">
                    {repair.deviceModel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {repair.customer?.name || "—"}
                  </p>
                </div>

                {/* Right */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${color}`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </span>
                  <div className="flex flex-wrap justify-end gap-1">
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${getPaymentStatusBadge(repair.paymentStatus).color}`}
                    >
                      {getPaymentStatusBadge(repair.paymentStatus).label}
                    </span>
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${getPickupBadge(repair.isPickedUp).color}`}
                    >
                      {getPickupBadge(repair.isPickedUp).label}
                    </span>
                  </div>
                  {hasRole("manager") && (
                    <span className="text-xs font-medium text-foreground">
                      {formatCurrency(repair.serviceCharge)}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(repair.createdAt)}
                  </span>
                </div>

                {/* Actions */}
                {hasRole("manager") && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  >
                    <RowActions actions={buildActions(repair)} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      <TableFooter
        pagination={pagination}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onLimitChange={(limit) =>
          setPagination((p) => ({ ...p, limit, page: 1 }))
        }
      />

      {/* ── Dialogs ── */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, label: "" })}
        onConfirm={handleDelete}
        title="Delete Repair"
        description={`Repair "${deleteDialog.label}" will be deleted and removed from your lists.`}
        confirmLabel="Delete"
        danger
      />
      <ConfirmDialog
        open={bulkDeleteDialog}
        onClose={() => setBulkDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedRepairs.length} Repairs`}
        description="All selected repairs will be deleted and removed from your lists."
        confirmLabel="Delete All"
        danger
      />
    </div>
  );
};

export default RepairList;