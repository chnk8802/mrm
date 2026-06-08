import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Users,
  Building,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import customerService from '@/api/customerService';

import PageHeader from '@/components/common/PageHeader';
import TableFooter from '@/components/common/TableFooter';
import RowActions from '@/components/common/RowActions';
import FilterPopover from '@/components/common/FilterPopover';
import ConfirmDialog from '@/components/common/ConfirmDialog';

// ─── Constants ────────────────────────────────────────────────────────────────

const customerTypeOptions = [
  { value: 'business',   label: 'Business'    },
  { value: 'individual', label: 'Individual'  },
];

const columns = [
  { label: 'Name',    col: 'name'         },
  { label: 'Type',    col: 'customerType' },
  { label: 'Phone',   col: 'phone'        },
  { label: 'Email',   col: 'email'        },
  { label: 'Created', col: 'createdAt'    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTypeBadge = (type) =>
  type === 'business'
    ? 'bg-blue-500/10 text-blue-500'
    : 'bg-green-500/10 text-green-500';

const TypeIcon = ({ type }) =>
  type === 'business'
    ? <Building className="w-3 h-3" />
    : <Users className="w-3 h-3" />;

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

// ─── Bulk Update Modal ────────────────────────────────────────────────────────

const BulkUpdateModal = ({ count, onClose, onSubmit, loading }) => {
  const [customerType, setCustomerType] = useState('');

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm px-4">
        <div className="bg-card border border-border rounded-xl shadow-xl">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">Bulk Update</h2>
              <p className="text-xs text-muted-foreground">
                {count} customer{count !== 1 ? 's' : ''} selected
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>

          <div className="px-5 py-4">
            <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Customer Type
            </p>
            <div className="flex flex-col gap-2">
              {customerTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCustomerType(opt.value)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg border text-sm flex items-center gap-2 transition-colors',
                    customerType === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted/40'
                  )}
                >
                  <TypeIcon type={opt.value} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 px-5 pb-4">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!customerType) { toast.error('Please select a type'); return; }
                onSubmit({ customerType });
              }}
              disabled={loading || !customerType}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── CustomerList ─────────────────────────────────────────────────────────────

const CustomerList = () => {
  const navigate = useNavigate();

  const [customers, setCustomers]           = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectAll, setSelectAll]           = useState(false);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);

  const [searchOpen, setSearchOpen]         = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [showFilters, setShowFilters]       = useState(false);
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [typeOpen, setTypeOpen]             = useState(false);

  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [bulkUpdating, setBulkUpdating]     = useState(false);

  const [deleteDialog, setDeleteDialog]     = useState({ open: false, id: null, label: '' });
  const [bulkDeleteDialog, setBulkDeleteDialog]   = useState(false);
  const [bulkUpdateConfirm, setBulkUpdateConfirm] = useState({ open: false, data: null });

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [sortBy, setSortBy]         = useState('createdAt');
  const [sortOrder, setSortOrder]   = useState('desc');

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: pagination.page, limit: pagination.limit, sortBy, sortOrder };
      if (searchQuery)         params.search       = searchQuery;
      if (customerTypeFilter)  params.customerType = customerTypeFilter;
      const response = await customerService.getCustomers(params);
      setCustomers(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, customerTypeFilter, searchQuery]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  useEffect(() => {
    const t = setTimeout(() => setPagination((p) => ({ ...p, page: 1 })), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Sort ─────────────────────────────────────────────────────────────────

  const handleSort = (col) => {
    if (sortBy === col) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortOrder('asc'); }
  };

  const renderSortIcon = (col) => {
    if (sortBy !== col) return null;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3" />;
  };

  // ── Selection ─────────────────────────────────────────────────────────────

  const handleSelectAll = () => {
    if (selectAll) setSelectedCustomers([]);
    else setSelectedCustomers(customers.map((c) => c._id));
    setSelectAll((p) => !p);
  };

  const handleSelectCustomer = (id) =>
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    try {
      await customerService.deleteCustomer(deleteDialog.id);
      toast.success('Customer deleted');
      setDeleteDialog({ open: false, id: null, label: '' });
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await customerService.bulkDeleteCustomers(selectedCustomers);
      toast.success(`${selectedCustomers.length} customers deleted`);
      setSelectedCustomers([]);
      setSelectAll(false);
      setBulkDeleteDialog(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // ── Bulk Update ───────────────────────────────────────────────────────────

  const handleBulkUpdateRequest = (data) => {
    setBulkUpdateOpen(false);
    setBulkUpdateConfirm({ open: true, data });
  };

  const handleBulkUpdateConfirm = async () => {
    try {
      setBulkUpdating(true);
      await customerService.bulkUpdateCustomers({ ids: selectedCustomers, data: bulkUpdateConfirm.data });
      toast.success(`${selectedCustomers.length} customers updated`);
      setBulkUpdateConfirm({ open: false, data: null });
      setSelectedCustomers([]);
      setSelectAll(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setBulkUpdating(false);
    }
  };

  // ── Misc ──────────────────────────────────────────────────────────────────

  const clearFilters = () => {
    setCustomerTypeFilter('');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const filterCount = customerTypeFilter ? 1 : 0;

  // ── Filter panel (passed as child to PageHeader) ───────────────────────────

  const filterPanel = (
    <FilterPopover
      open={showFilters}
      onClose={() => setShowFilters(false)}
      onClear={clearFilters}
      hasFilters={filterCount > 0}
    >
      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
        Customer Type
      </p>
      <Popover open={typeOpen} onOpenChange={setTypeOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between h-8 text-sm">
            {customerTypeFilter
              ? customerTypeOptions.find((t) => t.value === customerTypeFilter)?.label
              : 'All Types'}
            <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-0">
          <Command>
            <CommandInput placeholder="Search type..." />
            <CommandList>
              <CommandEmpty>No type found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value=""
                  onSelect={() => {
                    setCustomerTypeFilter('');
                    setPagination((p) => ({ ...p, page: 1 }));
                    setTypeOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-3 w-3', !customerTypeFilter ? 'opacity-100' : 'opacity-0')} />
                  All Types
                </CommandItem>
                {customerTypeOptions.map((type) => (
                  <CommandItem
                    key={type.value}
                    value={type.value}
                    onSelect={(val) => {
                      setCustomerTypeFilter(val === customerTypeFilter ? '' : val);
                      setPagination((p) => ({ ...p, page: 1 }));
                      setTypeOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-3 w-3', customerTypeFilter === type.value ? 'opacity-100' : 'opacity-0')} />
                    {type.label}
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

      {/* ── Header: bulk mode or normal ── */}
      {selectedCustomers.length > 0 ? (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
          <span className="text-sm text-muted-foreground">
            {selectedCustomers.length} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-sm"
              onClick={() => setBulkUpdateOpen(true)}
            >
              Bulk Update
            </Button>
            <Button variant="destructive" size="sm" className="h-8 text-sm"
              onClick={() => setBulkDeleteDialog(true)}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      ) : (
        <PageHeader
          title="Customers"
          searchOpen={searchOpen}
          searchQuery={searchQuery}
          onSearchToggle={() => {
            setSearchOpen((p) => !p);
            if (searchOpen) setSearchQuery('');
          }}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          onAddNew={() => navigate('/customers/new')}
          addLabel="Add Customer"
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
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-3.5 h-3.5 rounded border-border"
                />
              </th>
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
                <td colSpan="7" className="text-center py-16 text-sm text-muted-foreground">
                  Loading customers...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-16 text-sm text-muted-foreground">
                  {searchQuery || customerTypeFilter
                    ? 'No customers found matching your search'
                    : 'No customers found'}
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr
                  key={customer._id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => navigate(`/customers/${customer._id}`)}
                >
                  <td className="py-1 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer._id)}
                      onChange={() => handleSelectCustomer(customer._id)}
                      className="w-3.5 h-3.5 rounded border-border"
                    />
                  </td>
                  <td className="py-1 px-4">
                    <p className="text-sm font-medium text-foreground">{customer.name}</p>
                    {customer.address?.city && (
                      <p className="text-xs text-muted-foreground">{customer.address.city}</p>
                    )}
                  </td>
                  <td className="py-1 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getTypeBadge(customer.customerType)}`}>
                      <TypeIcon type={customer.customerType} />
                      {customer.customerType === 'business' ? 'Business' : 'Individual'}
                    </span>
                  </td>
                  <td className="py-1 px-4 text-sm text-muted-foreground">
                    {customer.phone || '—'}
                  </td>
                  <td className="py-1 px-4 text-sm text-muted-foreground">
                    {customer.email || '—'}
                  </td>
                  <td className="py-1 px-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="py-1 px-4">
                    <RowActions
                      actions={[
                        {
                          label: 'Edit',
                          icon: Edit,
                          onClick: () => navigate(`/customers/${customer._id}/edit`),
                        },
                        {
                          label: 'Delete',
                          icon: Trash2,
                          danger: true,
                          divider: true,
                          onClick: () => setDeleteDialog({ open: true, id: customer._id, label: customer.name }),
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

      {/* ── Mobile Cards ── */}
      <div className="md:hidden flex-1 overflow-y-auto divide-y divide-border">
        {loading ? (
          <p className="text-center py-16 text-sm text-muted-foreground">Loading customers...</p>
        ) : customers.length === 0 ? (
          <p className="text-center py-16 text-sm text-muted-foreground">
            {searchQuery || customerTypeFilter ? 'No customers found' : 'No customers yet'}
          </p>
        ) : (
          customers.map((customer) => (
            <div
              key={customer._id}
              onClick={() => navigate(`/customers/${customer._id}`)}
              className="px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors flex items-center justify-between gap-3"
            >
              {/* Checkbox */}
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <input
                  type="checkbox"
                  checked={selectedCustomers.includes(customer._id)}
                  onChange={() => handleSelectCustomer(customer._id)}
                  className="w-3.5 h-3.5 rounded border-border"
                />
              </div>

              {/* Left: name / contact */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{customer.name}</p>
                {customer.email && (
                  <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                )}
                {customer.phone && (
                  <p className="text-xs text-muted-foreground">{customer.phone}</p>
                )}
                {customer.address?.city && (
                  <p className="text-xs text-muted-foreground">{customer.address.city}</p>
                )}
              </div>

              {/* Right: badges + actions */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getTypeBadge(customer.customerType)}`}>
                  <TypeIcon type={customer.customerType} />
                  {customer.customerType === 'business' ? 'Business' : 'Individual'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(customer.createdAt)}
                </span>
              </div>

              {/* Row actions */}
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <RowActions
                  actions={[
                    {
                      label: 'Edit',
                      icon: Edit,
                      onClick: () => navigate(`/customers/${customer._id}/edit`),
                    },
                    {
                      label: 'Delete',
                      icon: Trash2,
                      danger: true,
                      divider: true,
                      onClick: () => setDeleteDialog({ open: true, id: customer._id, label: customer.name }),
                    },
                  ]}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Footer ── */}
      <TableFooter
        pagination={pagination}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onLimitChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
      />

      {/* ── Modals & Dialogs ── */}

      {bulkUpdateOpen && (
        <BulkUpdateModal
          count={selectedCustomers.length}
          onClose={() => setBulkUpdateOpen(false)}
          onSubmit={handleBulkUpdateRequest}
          loading={bulkUpdating}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, label: '' })}
        onConfirm={handleDelete}
        title="Delete Customer"
        description={`"${deleteDialog.label}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />

      <ConfirmDialog
        open={bulkDeleteDialog}
        onClose={() => setBulkDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedCustomers.length} Customers`}
        description="All selected customers will be permanently deleted. This cannot be undone."
        confirmLabel="Delete All"
        danger
      />

      <ConfirmDialog
        open={bulkUpdateConfirm.open}
        onClose={() => setBulkUpdateConfirm({ open: false, data: null })}
        onConfirm={handleBulkUpdateConfirm}
        title={`Update ${selectedCustomers.length} Customers`}
        description={`All selected customers will be set to "${bulkUpdateConfirm.data?.customerType}". Continue?`}
        confirmLabel="Update"
        danger={false}
        loading={bulkUpdating}
      />
    </div>
  );
};

export default CustomerList;