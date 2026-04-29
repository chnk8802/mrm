import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Calendar,
  FileText,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import customerService from '@/services/customerService';

const CustomerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Customer data state
  const [customer, setCustomer] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Actions Button
  const [showActions, setShowActions] = useState(false);

  // Fetch customer data on mount
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await customerService.getCustomerById(id);
        setCustomer(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch customer');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      setDeleting(true);
      await customerService.deleteCustomer(id);
      navigate('/customers');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading customer details...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }


  // Not found state
  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Customer not found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/customers/${id}/edit`)}
            className="gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <div className='relative'>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowActions((prev) => !prev)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <button
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-red-600 hover:bg-red-50`}
                    onClick={() => {
                      handleDelete();
                      setShowActions(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="flex items-start gap-3">
              <div>
                <div className="text-sm text-gray-500">Customer Name</div>
                <div className="font-medium">{customer.name || 'Not provided'}</div>
              </div>
            </div>
            {/* Customer Type */}
            <div className="flex items-start gap-3">
              <div>
                <div className="text-sm text-gray-500">Customer Type</div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${customer.customerType === 'business'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
                  }`}>
                  {customer.customerType === 'business' ? (
                    <Building className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  {customer.customerType === 'business' ? 'Business' : 'Individual'}
                </span>
              </div>
            </div>
            {/* Phone */}
            <div className="flex items-start gap-3">
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="font-medium">{customer.phone || 'Not provided'}</div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{customer.email || 'Not provided'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Address</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.address?.street || customer.address?.city || customer.address?.state || customer.address?.postalCode ? (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  {customer.address?.street && (
                    <div className="font-medium">{customer.address.street}</div>
                  )}
                  <div className="text-gray-600">
                    {[customer.address?.city, customer.address?.state, customer.address?.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                  {customer.address?.country && (
                    <div className="text-gray-600">{customer.address.country}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No address provided</div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {customer.notes && (
          <Card className="shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
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
                  <div className="font-medium">{formatDate(customer.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div className="font-medium">{formatDate(customer.updatedAt)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDetails;
