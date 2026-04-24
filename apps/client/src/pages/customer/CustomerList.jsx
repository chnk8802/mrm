import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Users,
  Building,
  Filter,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import customerService from '@/services/customerService';

const CustomerList = () => {
  const navigate = useNavigate();
  
  // State for customers data
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for selected customers (bulk actions)
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // State for pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // State for sorting
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // State for bulk action loading
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Page size options
  const pageSizeOptions = [5, 10, 25, 50];

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder
      };
      
      if (searchQuery) params.search = searchQuery;
      if (customerTypeFilter) params.customerType = customerTypeFilter;
      
      const response = await customerService.getCustomers(params);
      
      setCustomers(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Re-fetch when pagination, sort, or filter changes
  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.limit, sortBy, sortOrder, customerTypeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c._id));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual selection
  const handleSelectCustomer = (id) => {
    setSelectedCustomers(prev => {
      if (prev.includes(id)) {
        return prev.filter(c => c !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)?`)) {
      return;
    }
    
    try {
      setBulkActionLoading(true);
      await customerService.bulkDeleteCustomers(selectedCustomers);
      setSelectedCustomers([]);
      setSelectAll(false);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customers');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle delete single customer
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }
    
    try {
      await customerService.deleteCustomer(id);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer');
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    setPagination(prev => ({ 
      ...prev, 
      limit: parseInt(e.target.value),
      page: 1 
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setCustomerTypeFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Render sort icon
  const renderSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer database</p>
        </div>
        <Button onClick={() => navigate('/customers/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(customerTypeFilter) && (
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  1
                </span>
              )}
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Type
                  </label>
                  <select
                    value={customerTypeFilter}
                    onChange={(e) => {
                      setCustomerTypeFilter(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="business">Business</option>
                    <option value="individual">Individual</option>
                  </select>
                </div>
                <Button variant="ghost" onClick={clearFilters} className="gap-1">
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedCustomers.length > 0 && (
        <Card className="bg-primary/5 border-primary shadow-sm">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedCustomers.length} customer(s) selected
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

      {/* Customers Table */}
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
                  <th 
                    className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('customerType')}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      {renderSortIcon('customerType')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('phone')}
                  >
                    <div className="flex items-center gap-1">
                      Phone
                      {renderSortIcon('phone')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      {renderSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      {renderSortIcon('createdAt')}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr 
                      key={customer._id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        selectedCustomers.includes(customer._id) ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
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
                          <div className="text-sm text-gray-500">{customer.address.city}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          customer.customerType === 'business' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {customer.customerType === 'business' ? (
                            <Building className="w-3 h-3" />
                          ) : (
                            <Users className="w-3 h-3" />
                          )}
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
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/customers/${customer._id}`)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/customers/${customer._id}/edit`)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(customer._id)}
                            title="Delete"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
          <span className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
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

export default CustomerList;
