import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Truck, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import supplierService from '@/api/supplierService';

import PageHeader from '@/components/common/PageHeader';
import TableFooter from '@/components/common/TableFooter';
import RowActions from '@/components/common/RowActions';
import ConfirmDialog from '@/components/common/ConfirmDialog';

// ─── Constants ────────────────────────────────────────────────────────────────

const columns = [
  { label: 'Name',           col: 'name'         },
  { label: 'Contact Person', col: 'contactPerson' },
  { label: 'Phone',          col: 'phone'         },
  { label: 'Email',          col: 'email'         },
  { label: 'Status',         col: 'isActive'      },
  { label: 'Created',        col: 'createdAt'     },
];

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

// ─── Bulk Update Modal ────────────────────────────────────────────────────────

const BulkUpdateModal = ({ count, onClose, onSubmit, loading }) => {
  const [isActive, setIsActive] = useState('');

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm px-4">
        <div className="bg-card border border-border rounded-xl shadow-xl">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold">Bulk Update</h2>
              <p className="text-xs text-muted-foreground">
                {count} supplier{count !== 1 ? 's' : ''} selected
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-4">
            <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              Status
            </p>
            <Select value={isActive} onValueChange={setIsActive}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true" className="text-sm">Active</SelectItem>
                <SelectItem value="false" className="text-sm">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 px-5 pb-4">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (isActive === '') { toast.error('Please select a status'); return; }
                onSubmit({ isActive: isActive === 'true' });
              }}
              disabled={loading || isActive === ''}
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

// ─── SupplierList ─────────────────────────────────────────────────────────────

const SupplierList = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers]               = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);

  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [selectAll, setSelectAll]               = useState(false);

  const [searchOpen, setSearchOpen]             = useState(false);
  const [searchQuery, setSearchQuery]           = useState('');

  const [pagination, setPagination]             = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [sortBy, setSortBy]                     = useState('createdAt');
  const [sortOrder, setSortOrder]               = useState('desc');

  const [bulkUpdateOpen, setBulkUpdateOpen]     = useState(false);
  const [bulkUpdating, setBulkUpdating]         = useState(false);

  const [deleteDialog, setDeleteDialog]         = useState({ open: false, id: null, label: '' });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [bulkUpdateConfirm, setBulkUpdateConfirm] = useState({ open: false, data: null });

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: pagination.page, limit: pagination.limit, sortBy, sortOrder };
      if (searchQuery) params.search = searchQuery;

      const response = await supplierService.getSuppliers(params);
      setSuppliers(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, searchQuery]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  useEffect(() => {
    const t = setTimeout(() => setPagination((p) => ({ ...p, page: 1 })), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Sort ──────────────────────────────────────────────────────────────────

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
    if (selectAll) setSelectedSuppliers([]);
    else setSelectedSuppliers(suppliers.map((s) => s._id));
    setSelectAll((p) => !p);
  };

  const handleSelectSupplier = (id) =>
    setSelectedSuppliers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    try {
      await supplierService.deleteSupplier(deleteDialog.id);
      toast.success('Supplier deleted');
      setDeleteDialog({ open: false, id: null, label: '' });
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete supplier');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await supplierService.bulkDeleteSuppliers({ids: selectedSuppliers});
      toast.success(`${selectedSuppliers.length} suppliers deleted`);
      setSelectedSuppliers([]);
      setSelectAll(false);
      setBulkDeleteDialog(false);
      fetchSuppliers();
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
      await supplierService.bulkUpdateSuppliers({ ids: selectedSuppliers, data: bulkUpdateConfirm.data });
      toast.success(`${selectedSuppliers.length} suppliers updated`);
      setBulkUpdateConfirm({ open: false, data: null });
      setSelectedSuppliers([]);
      setSelectAll(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setBulkUpdating(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>

      {/* ── Header: bulk mode or normal ── */}
      {selectedSuppliers.length > 0 ? (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
          <span className="text-sm text-muted-foreground">
            {selectedSuppliers.length} selected
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
          title="Suppliers"
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
          onAddNew={() => navigate('/suppliers/new')}
          addLabel="Add Supplier"
        />
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
                <td colSpan="8" className="text-center py-16 text-sm text-muted-foreground">
                  Loading suppliers...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-16 text-sm text-muted-foreground">
                  <Truck className="mx-auto w-8 h-8 mb-2 opacity-30" />
                  {searchQuery ? 'No suppliers found matching your search' : 'No suppliers yet'}
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr
                  key={supplier._id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => navigate(`/suppliers/${supplier._id}`)}
                >
                  <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedSuppliers.includes(supplier._id)}
                      onChange={() => handleSelectSupplier(supplier._id)}
                      className="w-3.5 h-3.5 rounded border-border"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-medium text-foreground">{supplier.name}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {supplier.contactPerson || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {supplier.phone || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {supplier.email || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      supplier.isActive
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(supplier.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <RowActions
                      actions={[
                        {
                          label: 'Edit',
                          icon: Edit,
                          onClick: () => navigate(`/suppliers/${supplier._id}/edit`),
                        },
                        {
                          label: 'Delete',
                          icon: Trash2,
                          danger: true,
                          divider: true,
                          onClick: () => setDeleteDialog({ open: true, id: supplier._id, label: supplier.name }),
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
          <p className="text-center py-16 text-sm text-muted-foreground">Loading suppliers...</p>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Truck className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">{searchQuery ? 'No suppliers found' : 'No suppliers yet'}</p>
          </div>
        ) : (
          suppliers.map((supplier) => (
            <div
              key={supplier._id}
              onClick={() => navigate(`/suppliers/${supplier._id}`)}
              className="px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors flex items-center gap-3"
            >
              {/* Checkbox */}
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <input
                  type="checkbox"
                  checked={selectedSuppliers.includes(supplier._id)}
                  onChange={() => handleSelectSupplier(supplier._id)}
                  className="w-3.5 h-3.5 rounded border-border"
                />
              </div>

              {/* Left: name / contact */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{supplier.name}</p>
                {supplier.contactPerson && (
                  <p className="text-xs text-muted-foreground truncate">{supplier.contactPerson}</p>
                )}
                {supplier.phone && (
                  <p className="text-xs text-muted-foreground">{supplier.phone}</p>
                )}
                {supplier.email && (
                  <p className="text-xs text-muted-foreground truncate">{supplier.email}</p>
                )}
              </div>

              {/* Right: date */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                  supplier.isActive
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(supplier.createdAt)}
                </span>
              </div>

              {/* Actions */}
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <RowActions
                  actions={[
                    {
                      label: 'Edit',
                      icon: Edit,
                      onClick: () => navigate(`/suppliers/${supplier._id}/edit`),
                    },
                    {
                      label: 'Delete',
                      icon: Trash2,
                      danger: true,
                      divider: true,
                      onClick: () => setDeleteDialog({ open: true, id: supplier._id, label: supplier.name }),
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

      {/* ── Bulk Update Modal ── */}
      {bulkUpdateOpen && (
        <BulkUpdateModal
          count={selectedSuppliers.length}
          onClose={() => setBulkUpdateOpen(false)}
          onSubmit={handleBulkUpdateRequest}
          loading={bulkUpdating}
        />
      )}

      {/* ── Confirm: Single Delete ── */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, label: '' })}
        onConfirm={handleDelete}
        title="Delete Supplier"
        description={`"${deleteDialog.label}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />

      {/* ── Confirm: Bulk Delete ── */}
      <ConfirmDialog
        open={bulkDeleteDialog}
        onClose={() => setBulkDeleteDialog(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedSuppliers.length} Suppliers`}
        description="All selected suppliers will be permanently deleted. This cannot be undone."
        confirmLabel="Delete All"
        danger
      />

      {/* ── Confirm: Bulk Update ── */}
      <ConfirmDialog
        open={bulkUpdateConfirm.open}
        onClose={() => setBulkUpdateConfirm({ open: false, data: null })}
        onConfirm={handleBulkUpdateConfirm}
        title={`Update ${selectedSuppliers.length} Suppliers`}
        description={`All selected suppliers will be marked as "${bulkUpdateConfirm.data?.isActive ? 'Active' : 'Inactive'}". Continue?`}
        confirmLabel="Update"
        danger={false}
        loading={bulkUpdating}
      />
    </div>
  );
};

export default SupplierList;