import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit, Trash2, ChevronUp, ChevronDown,
  Wrench, Clock, CheckCircle, XCircle, AlertCircle, PackageCheck,
  Check, ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';

import { useTheme } from '@/context/ThemeContext';

import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import repairService from '@/api/repairService';

import PageHeader from '@/components/common/PageHeader';
import TableFooter from '@/components/common/TableFooter';
import RowActions from '@/components/common/RowActions';
import FilterPopover from '@/components/common/FilterPopover';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Checkbox } from '@/components/ui/checkbox';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'received', label: 'Received' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'not-repairable', label: 'Not Repairable' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const columns = [
  { label: 'Repair ID', col: 'repairId' },
  { label: 'Device', col: 'deviceModel' },
  { label: 'Customer', col: null }, // populated, not sortable
  { label: 'Status', col: 'status' },
  { label: 'Charge', col: 'serviceCharge' },
  { label: 'Created', col: 'createdAt' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount ?? 0);

const getStatusBadge = (status) => {
  switch (status) {
    case 'received': return { icon: Clock, color: 'bg-yellow-500/10 text-yellow-500', label: 'Received' };
    case 'in-progress': return { icon: Wrench, color: 'bg-blue-500/10 text-blue-500', label: 'In Progress' };
    case 'ready': return { icon: PackageCheck, color: 'bg-purple-500/10 text-purple-500', label: 'Ready' };
    case 'not-repairable': return { icon: AlertCircle, color: 'bg-orange-500/10 text-orange-500', label: 'Not Repairable' };
    case 'completed': return { icon: CheckCircle, color: 'bg-green-500/10 text-green-500', label: 'Completed' };
    case 'cancelled': return { icon: XCircle, color: 'bg-red-500/10 text-red-500', label: 'Cancelled' };
    default: return { icon: AlertCircle, color: 'bg-muted text-muted-foreground', label: status };
  }
};

// ─── RepairList ───────────────────────────────────────────────────────────────

const RepairList = () => {
  const { theme, appTheme } = useTheme();
  const navigate = useNavigate();

  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRepairs, setSelectedRepairs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, label: '' });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchRepairs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: pagination.page, limit: pagination.limit, sortBy, sortOrder };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;

      const response = await repairService.getRepairs(params);
      setRepairs(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch repairs');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, statusFilter, searchQuery]);

  useEffect(() => { fetchRepairs(); }, [fetchRepairs]);

  useEffect(() => {
    const t = setTimeout(() => setPagination((p) => ({ ...p, page: 1 })), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Sort ──────────────────────────────────────────────────────────────────

  const handleSort = (col) => {
    if (!col) return;
    if (sortBy === col) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortOrder('asc'); }
  };

  const renderSortIcon = (col) => {
    if (!col || sortBy !== col) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  // ── Selection ─────────────────────────────────────────────────────────────

  const handleSelectAll = () => {
    if (selectAll) setSelectedRepairs([]);
    else setSelectedRepairs(repairs.map((r) => r._id));
    setSelectAll((p) => !p);
  };

  const handleSelectRepair = (id) =>
    setSelectedRepairs((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    try {
      await repairService.deleteRepair(deleteDialog.id);
      toast.success('Repair deleted');
      setDeleteDialog({ open: false, id: null, label: '' });
      fetchRepairs();
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to delete repair');
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedRepairs.map((id) => repairService.deleteRepair(id)));
      toast.success(`${selectedRepairs.length} repairs deleted`);
      setSelectedRepairs([]);
      setSelectAll(false);
      setBulkDeleteDialog(false);
      fetchRepairs();
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to delete repairs');
      }
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const filterCount = statusFilter ? 1 : 0;

  // ── Filter panel ──────────────────────────────────────────────────────────

  const filterPanel = (
    <FilterPopover
      open={showFilters}
      onClose={() => setShowFilters(false)}
      onClear={clearFilters}
      hasFilters={filterCount > 0}
    >
      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Status</p>
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between h-8 text-sm">
            {statusFilter
              ? STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label
              : 'All Statuses'}
            <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={`w-44 p-0 ${theme} bg-popover text-popover-foreground border-border`}
          data-app-theme={appTheme}>
          <Command>
            <CommandInput placeholder="Search status..." />
            <CommandList>
              <CommandEmpty>No status found.</CommandEmpty>
              <CommandGroup>
                <CommandItem value="" onSelect={() => { setStatusFilter(''); setPagination((p) => ({ ...p, page: 1 })); setStatusOpen(false); }}>
                  <Check className={cn('mr-2 h-3 w-3', !statusFilter ? 'opacity-100' : 'opacity-0')} />
                  <span className="text-xs">All Statuses</span>
                </CommandItem>
                {STATUS_OPTIONS.map((s) => (
                  <CommandItem
                    key={s.value}
                    value={s.value}
                    onSelect={(val) => {
                      setStatusFilter(val === statusFilter ? '' : val);
                      setPagination((p) => ({ ...p, page: 1 }));
                      setStatusOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-3 w-3', statusFilter === s.value ? 'opacity-100' : 'opacity-0')} />
                    <span className="text-xs">{s.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FilterPopover>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>

      {/* ── Header ── */}
      {selectedRepairs.length > 0 ? (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
          <span className="text-sm text-muted-foreground">{selectedRepairs.length} selected</span>
          <Button variant="destructive" size="sm" className="h-8 text-sm"
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
          onSearchToggle={() => { setSearchOpen((p) => !p); if (searchOpen) setSearchQuery(''); }}
          onSearchChange={(val) => { setSearchQuery(val); setPagination((p) => ({ ...p, page: 1 })); }}
          onAddNew={() => navigate('/app/repairs/new')}
          addLabel="New Repair"
          filterCount={filterCount}
          onFilterToggle={() => setShowFilters((p) => !p)}
        >
          {filterPanel}
        </PageHeader>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ── Desktop Table ── */}
      <div className="hidden md:block flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
            <tr className="border-b border-border">
              <th className="py-2.5 px-4 w-10">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              {columns.map(({ label, col }) => (
                <th key={label}
                  className={`text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap ${col ? 'cursor-pointer hover:text-foreground transition-colors' : ''}`}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-1">{label}{renderSortIcon(col)}</div>
                </th>
              ))}
              <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center py-16 text-sm text-muted-foreground">Loading repairs...</td></tr>
            ) : repairs.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-16 text-sm text-muted-foreground">
                  <Wrench className="mx-auto w-8 h-8 mb-2 opacity-30" />
                  {searchQuery || statusFilter ? 'No repairs found matching your filters' : 'No repairs yet'}
                </td>
              </tr>
            ) : (
              repairs.map((repair) => {
                const { icon: Icon, color, label } = getStatusBadge(repair.status);
                return (
                  <tr key={repair._id}
                    className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => navigate(`/app/repairs/${repair._id}`)}
                  >
                    <td className="py-1 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRepairs.includes(repair._id)}
                        onCheckedChange={() => handleSelectRepair(repair._id)}
                      />
                    </td>
                    <td className="py-1 px-4 text-sm font-medium text-foreground">{repair.repairId}</td>
                    <td className="py-1 px-4">
                      <p className="text-sm font-medium text-foreground">{repair.deviceModel}</p>
                      {repair.imei && <p className="text-xs text-muted-foreground">{repair.imei}</p>}
                    </td>
                    <td className="py-1 px-4">
                      <p className="text-sm text-foreground">{repair.customer?.name || '—'}</p>
                      {repair.customer?.phone && <p className="text-xs text-muted-foreground">{repair.customer.phone}</p>}
                    </td>
                    <td className="py-1 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${color}`}>
                        <Icon className="w-3 h-3" />{label}
                      </span>
                    </td>
                    <td className="py-1 px-4 text-sm text-foreground font-medium">
                      {formatCurrency(repair.serviceCharge)}
                      {repair.discount > 0 && (
                        <p className="text-xs text-muted-foreground">-{formatCurrency(repair.discount)}</p>
                      )}
                    </td>
                    <td className="py-1 px-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(repair.createdAt)}
                    </td>
                    <td className="py-1 px-4" onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        actions={[
                          { label: 'Edit', icon: Edit, onClick: () => navigate(`/app/repairs/${repair._id}/edit`) },
                          {
                            label: 'Delete', icon: Trash2, danger: true, divider: true,
                            onClick: () => setDeleteDialog({ open: true, id: repair._id, label: repair.repairId })
                          },
                        ]}
                      />
                    </td>
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
          <p className="text-center py-16 text-sm text-muted-foreground">Loading repairs...</p>
        ) : repairs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Wrench className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">{searchQuery || statusFilter ? 'No repairs found' : 'No repairs yet'}</p>
          </div>
        ) : (
          repairs.map((repair) => {
            const { icon: Icon, color, label } = getStatusBadge(repair.status);
            return (
              <div key={repair._id}
                onClick={() => navigate(`/app/repairs/${repair._id}`)}
                className="px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors flex items-center gap-3"
              >
                {/* Checkbox */}
                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                  <Checkbox
                    checked={selectedRepairs.includes(repair._id)}
                    onCheckedChange={() => handleSelectRepair(repair._id)} />
                </div>

                {/* Left */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{repair.repairId}</p>
                  <p className="text-xs text-muted-foreground truncate">{repair.deviceModel}</p>
                  <p className="text-xs text-muted-foreground">{repair.customer?.name || '—'}</p>
                </div>

                {/* Right */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${color}`}>
                    <Icon className="w-3 h-3" />{label}
                  </span>
                  <span className="text-xs font-medium text-foreground">{formatCurrency(repair.serviceCharge)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(repair.createdAt)}</span>
                </div>

                {/* Actions */}
                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                  <RowActions
                    actions={[
                      { label: 'Edit', icon: Edit, onClick: () => navigate(`/app/repairs/${repair._id}/edit`) },
                      {
                        label: 'Delete', icon: Trash2, danger: true, divider: true,
                        onClick: () => setDeleteDialog({ open: true, id: repair._id, label: repair.repairId })
                      },
                    ]}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      <TableFooter
        pagination={pagination}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onLimitChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
      />

      {/* ── Dialogs ── */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, label: '' })}
        onConfirm={handleDelete}
        title="Delete Repair"
        description={`Repair "${deleteDialog.label}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
      <ConfirmDialog
        open={bulkDeleteDialog}
        onClose={() => setBulkDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedRepairs.length} Repairs`}
        description="All selected repairs will be permanently deleted. This cannot be undone."
        confirmLabel="Delete All"
        danger
      />
    </div>
  );
};

export default RepairList;