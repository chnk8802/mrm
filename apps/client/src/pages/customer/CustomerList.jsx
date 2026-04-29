import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Users,
  Building,
  Filter,
  X,
  MoreVertical,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import customerService from '@/services/customerService';
import SelectCustomerType from '@/components/Select';
import Select from '@/components/Select';

const customerTypeOptions = [
  { value: 'business', label: 'Business' },
  { value: 'individual', label: 'Individual' },
];

const BulkUpdateModal = ({ count, onClose, onSubmit, loading }) => {
  const [customerType, setCustomerType] = useState('');

  const handleSubmit = () => {
    if (!customerType) {
      alert('Please select a customer type');
      return;
    }
    onSubmit({ customerType });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-auto">
        <div className="bg-white rounded-xl shadow-xl mx-4">

          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-base font-semibold">Bulk Update</h2>
              <p className="text-sm text-gray-500">
                {count} customer{count !== 1 ? 's' : ''} selected
              </p>
            </div>
            <button onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5">
            <label className="block text-sm font-medium mb-2">
              Customer Type
            </label>

            <Select
              options={customerTypeOptions}
              value={customerType}
              onValueChange={setCustomerType}
              placeholder="Select type..."
            />
          </div>

          <div className="flex gap-2 px-6 pb-5">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
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


const CustomerList = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  const [searchQuery, setSearchQuery] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const pageSizeOptions = [5, 10, 25, 50];

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c._id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectCustomer = (id) => {
    setSelectedCustomers(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const fetchCustomers = async () => {
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
      if (customerTypeFilter) params.customerType = customerTypeFilter;

      const response = await customerService.getCustomers(params);
      setCustomers(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.limit, sortBy, sortOrder, customerTypeFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customerService.deleteCustomer(id);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  const handlePageChange = (newPage) =>
    setPagination(prev => ({ ...prev, page: newPage }));

  const handlePageSizeChange = (e) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(e.target.value),
      page: 1,
    }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCustomerTypeFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const renderSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const handleBulkUpdateSubmit = async (data) => {
    if (!window.confirm(`Update ${selectedCustomers.length} customers?`)) return;
    try {
      setBulkUpdating(true);
      await customerService.bulkUpdateCustomers({
        ids: selectedCustomers,
        data,
      });
      setBulkUpdateOpen(false);
      setSelectedCustomers([]);
      setSelectAll(false);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedCustomers.length} customers?`)) return;
    try {
      await customerService.bulkDeleteCustomers(selectedCustomers);
      setSelectedCustomers([]);
      setSelectAll(false);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {selectedCustomers.length > 0 ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-gray-600">
            {selectedCustomers.length} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkUpdateOpen(true)}>
              Bulk Update
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete Selected
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2">
          {/* Search */}
          <div className="flex items-center gap-2">
            {searchOpen && (
              <Input
                autoFocus
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-56"
              />
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSearchOpen(prev => !prev);
                if (searchOpen) {
                  setSearchQuery('');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }
              }}
            >
              {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
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
              {customerTypeFilter && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">
                  1
                </span>
              )}
            </Button>

            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <div className="absolute right-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-56">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Customer Type
                  </p>
                  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={typeOpen}
                        className="w-full justify-between"
                      >
                        {customerTypeFilter
                          ? customerTypeOptions.find(t => t.value === customerTypeFilter)?.label
                          : 'All Types'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                setPagination(prev => ({ ...prev, page: 1 }));
                                setTypeOpen(false);
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', customerTypeFilter === '' ? 'opacity-100' : 'opacity-0')} />
                              All Types
                            </CommandItem>
                            {customerTypeOptions.map(type => (
                              <CommandItem
                                key={type.value}
                                value={type.value}
                                onSelect={(val) => {
                                  setCustomerTypeFilter(val === customerTypeFilter ? '' : val);
                                  setPagination(prev => ({ ...prev, page: 1 }));
                                  setTypeOpen(false);
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', customerTypeFilter === type.value ? 'opacity-100' : 'opacity-0')} />
                                {type.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>


                  {customerTypeFilter && (
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

          {/* Add Customer */}
          {!searchOpen && (
            <Button onClick={() => navigate('/customers/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Customers Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </th>
                  {[
                    { label: 'Name', col: 'name' },
                    { label: 'Type', col: 'customerType' },
                    { label: 'Phone', col: 'phone' },
                    { label: 'Email', col: 'email' },
                    { label: 'Created', col: 'createdAt' },
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
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      {searchQuery || customerTypeFilter
                        ? 'No customers found matching your search'
                        : 'No customers found'}
                    </td>
                  </tr>
                ) : (
                  customers.map(customer => (
                    <tr
                      key={customer._id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/customers/${customer._id}`)}
                    >
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer._id)}
                          onChange={() => handleSelectCustomer(customer._id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        {customer.address?.city && (
                          <div className="text-xs text-gray-500">{customer.address.city}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${customer.customerType === 'business'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                          }`}>
                          {customer.customerType === 'business'
                            ? <Building className="w-3 h-3" />
                            : <Users className="w-3 h-3" />}
                          {customer.customerType === 'business' ? 'Business' : 'Individual'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {customer.phone || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {customer.email || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPosition({
                                top: rect.bottom + window.scrollY,
                                right: window.innerWidth - rect.right,
                              });
                              setOpenActionId(openActionId === customer._id ? null : customer._id);
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>

                          {openActionId === customer._id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenActionId(null)} />
                              <div
                                style={{ position: 'fixed', top: menuPosition.top, right: menuPosition.right }}
                                className="w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1"
                              >
                                <Button
                                  onClick={() => {
                                    navigate(`/customers/${customer._id}/edit`);
                                    setOpenActionId(null);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </Button>
                                <div className="border-t border-gray-100 my-1" />
                                <Button
                                  onClick={() => {
                                    handleDelete(customer._id);
                                    setOpenActionId(null);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </Button>
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
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600">entries</span>
        </div>

        <div className="flex items-center gap-2">
          {pagination.total > 0 && (
            <span className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
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
            if (pagination.pages <= 5) pageNum = i + 1;
            else if (pagination.page <= 3) pageNum = i + 1;
            else if (pagination.page >= pagination.pages - 2) pageNum = pagination.pages - 4 + i;
            else pageNum = pagination.page - 2 + i;

            return (
              <Button
                key={pageNum}
                variant={pagination.page === pageNum ? 'default' : 'outline'}
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

      {/* Bulk Update Modal */}
      {bulkUpdateOpen && (
        <BulkUpdateModal
          count={selectedCustomers.length}
          onClose={() => setBulkUpdateOpen(false)}
          onSubmit={handleBulkUpdateSubmit}
          loading={bulkUpdating}
        />
      )}
    </div>
  );
};

export default CustomerList;