import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Wrench,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import repairService from '@/services/repairService';

const RepairDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Repair data state
  const [repair, setRepair] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch repair data on mount
  useEffect(() => {
    const fetchRepair = async () => {
      try {
        setLoading(true);
        const response = await repairService.getRepairById(id);
        setRepair(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch repair');
      } finally {
        setLoading(false);
      }
    };

    fetchRepair();
  }, [id]);

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this repair?')) {
      return;
    }

    try {
      setDeleting(true);
      await repairService.deleteRepair(id);
      navigate('/repairs');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete repair');
    } finally {
      setDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { icon: <Clock className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' };
      case 'in-progress':
        return { icon: <Wrench className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700', label: 'In Progress' };
      case 'completed':
        return { icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-100 text-green-700', label: 'Completed' };
      case 'cancelled':
        return { icon: <XCircle className="w-5 h-5" />, color: 'bg-red-100 text-red-700', label: 'Cancelled' };
      default:
        return { icon: <AlertCircle className="w-5 h-5" />, color: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading repair details...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/repairs')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Repair Details</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Not found state
  if (!repair) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/repairs')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Repair Details</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Repair not found
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(repair.status);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/repairs')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{repair.repairId}</h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.icon}
                {statusInfo.label}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{repair.model}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/repairs/${id}/edit`)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Phone Model</div>
              <div className="font-medium">{repair.model}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">IMEI</div>
              <div className="font-medium font-mono">{repair.imei}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Problem</div>
              <div className="font-medium">{repair.problem}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Priority</div>
              <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getPriorityColor(repair.priority)}`}>
                {repair.priority?.charAt(0).toUpperCase() + repair.priority?.slice(1)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Customer & Technician */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer & Technician
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Customer</div>
              <div className="font-medium">{repair.customer?.name || 'N/A'}</div>
              {repair.customer?.phone && (
                <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" />
                  {repair.customer.phone}
                </div>
              )}
              {repair.customer?.email && (
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {repair.customer.email}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-500">Technician</div>
              {repair.technician ? (
                <div className="font-medium">{repair.technician.name}</div>
              ) : (
                <div className="text-gray-400">Not assigned</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Repair Price</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(repair.repairPrice)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Cost Price</div>
              <div className="text-xl font-medium text-gray-700">
                {formatCurrency(repair.costPrice)}
              </div>
            </div>
            {repair.repairPrice && repair.costPrice && (
              <div>
                <div className="text-sm text-gray-500">Profit</div>
                <div className="text-xl font-medium text-blue-600">
                  {formatCurrency(repair.repairPrice - repair.costPrice)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Components */}
        {repair.components && repair.components.length > 0 && (
          <Card className="shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Components</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {repair.components.map((component, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {component}
                    {component === 'Other' && repair.otherComponent && `: ${repair.otherComponent}`}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Record Information */}
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Record Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-medium">{formatDate(repair.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div className="font-medium">{formatDate(repair.updatedAt)}</div>
                </div>
              </div>
              {repair.completedAt && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="text-sm text-gray-500">Completed</div>
                    <div className="font-medium">{formatDate(repair.completedAt)}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RepairDetails;
