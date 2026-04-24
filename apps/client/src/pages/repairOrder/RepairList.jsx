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
  Wrench,
  Users,
  Filter,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import repairService from '@/services/repairService';
import customerService from '@/services/customerService';
import axios from 'axios';

const RepairList = () => {
  const navigate = useNavigate();

  // State for repairs data
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for selected repairs (bulk actions)
  const [selectedRepairs, setSelectedRepairs] = useState([]);
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
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // State for bulk action loading
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Page size options
  const pageSizeOptions = [5, 10, 25, 50];

  // Fetch repairs
  const fetchRepairs = async () => {
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
      if (statusFilter) params.status = statusFilter;

      const response = await repairService.getRepairs(params);

      setRepairs(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch repairs');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRepairs();
  }, []);

  // Re-fetch when pagination, sort, or filter changes
  useEffect(() => {
    fetchRepairs();
  }, [pagination.page, pagination.limit, sortBy, sortOrder, statusFilter]);

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
      setSelectedRepairs([]);
    } else {
      setSelectedRepairs(repairs.map(r => r._id));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual selection
  const handleSelectRepair = (id) => {
    setSelectedRepairs(prev => {
      if (prev.includes(id)) {
        return prev.filter(r => r !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedRepairs.length} repair(s)?`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      for (const id of selectedRepairs) {
        await repairService.deleteRepair(id);
      }
      setSelectedRepairs([]);
      setSelectAll(false);
      fetchRepairs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete repairs');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Handle delete single repair
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this repair?')) {
      return;
    }

    try {
      await repairService.deleteRepair(id);
      fetchRepairs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete repair');
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
    setStatusFilter('');
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' };
      case 'in-progress':
        return { icon: <Wrench className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700', label: 'In Progress' };
      case 'completed':
        return { icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-100 text-green-700', label: 'Completed' };
      case 'cancelled':
        return { icon: <XCircle className="w-3 h-3" />, color: 'bg-red-100 text-red-700', label: 'Cancelled' };
      default:
        return { icon: <AlertCircle className="w-3 h-3" />, color: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Repairs</h1>
          <p className="text-gray-600 mt-1">Manage repair orders</p>
        </div>
        <Button onClick={() => navigate('/repairs/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          New Repair
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
                placeholder="Search repairs..."
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
              {(statusFilter) && (
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
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
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
      {selectedRepairs.length > 0 && (
        <Card className="bg-primary/5 border-primary shadow-sm">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedRepairs.length} repair(s) selected
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

      {/* Repairs Table */}
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
                    onClick={() => handleSort('repairId')}
                  >
                    <div className="flex items-center gap-1">
                      Repair ID
                      {renderSortIcon('repairId')}
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('model')}
                  >
                    <div className="flex items-center gap-1">
                      Model
                      {renderSortIcon('model')}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Customer
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-4 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('repairPrice')}
                  >
                    <div className="flex items-center gap-1">
                      Price
                      {renderSortIcon('repairPrice')}
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
                      Loading repairs...
                    </td>
                  </tr>
                ) : repairs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      No repairs found
                    </td>
                  </tr>
                ) : (
                  repairs.map((repair) => {
                    const statusInfo = getStatusInfo(repair.status);
                    return (
                      <tr
                        key={repair._id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          selectedRepairs.includes(repair._id) ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedRepairs.includes(repair._id)}
                            onChange={() => handleSelectRepair(repair._id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{repair.repairId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{repair.model}</div>
                          <div className="text-xs text-gray-500">IMEI: {repair.imei}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {repair.customer?.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {formatCurrency(repair.repairPrice)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(repair.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/repairs/${repair._id}`)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/repairs/${repair._id}/edit`)}
                              title="Edit Repair"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(repair._id)}
                              title="Delete Repair"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={pagination.limit}
                onChange={handlePageSizeChange}
                className="h-8 w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-sm text-gray-600">of {pagination.total} results</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RepairList;
