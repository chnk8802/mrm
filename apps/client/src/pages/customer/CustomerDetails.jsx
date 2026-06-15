import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Building,
  Users,
  User,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import customerService from '@/api/customerService';
import RowActions from '@/components/common/RowActions';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  </div>
);

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatAddress = (address) => {
  if (!address) return null;
  const parts = [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
};

const getTypeBadge = (type) =>
  type === 'business'
    ? 'bg-blue-500/10 text-blue-500'
    : 'bg-green-500/10 text-green-500';

// ─── CustomerDetails ──────────────────────────────────────────────────────────

const CustomerDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [customer, setCustomer]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });

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

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await customerService.deleteCustomer(id);
      toast.success('Customer deleted');
      navigate('/app/customers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer');
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false });
    }
  };

  // ── States ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Loading customer details...
    </div>
  );

  if (error) return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/customers')} className="gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>
      <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-lg text-sm">
        {error}
      </div>
    </div>
  );

  if (!customer) return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/customers')} className="gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-2 rounded-lg text-sm">
        Customer not found
      </div>
    </div>
  );

  const address = formatAddress(customer.address);

  return (
    <div className="space-y-4 p-4 pb-24 md:pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/customers')}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Customers
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate(`/app/customers/${id}/edit`)}
            className="h-8 gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </Button>
          <RowActions
            actions={[
              {
                label: 'Delete',
                icon: Trash2,
                danger: true,
                onClick: () => setConfirmDialog({ open: true }),
              },
            ]}
          />
        </div>
      </div>

      {/* ── Profile Card ── */}
      <Card className="border-border shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg shrink-0">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate">
                {customer.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getTypeBadge(customer.customerType)}`}>
                  {customer.customerType === 'business'
                    ? <Building className="w-3 h-3" />
                    : <Users className="w-3 h-3" />}
                  {customer.customerType === 'business' ? 'Business' : 'Individual'}
                </span>
                {customer.address?.city && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {customer.address.city}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Contact Information ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Phone} label="Phone" value={customer.phone} />
            <InfoRow icon={Mail}  label="Email" value={customer.email} />
            <InfoRow icon={MapPin} label="Address" value={address} />
          </CardContent>
        </Card>
        {/* ── Financial Information ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Receipt} label="Outstanding Balance" value={`₹ ${customer.outstandingBalance}`} />
          </CardContent>
        </Card>

        {/* ── Record Information ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Record Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Calendar} label="Created"      value={formatDate(customer.createdAt)} />
            <InfoRow icon={Calendar} label="Last Updated" value={formatDate(customer.updatedAt)} />
            <InfoRow icon={User}     label="Customer ID"  value={customer._id} />
          </CardContent>
        </Card>

        {/* ── Notes (full width, only if present) ── */}
        {customer.notes && (
          <Card className="border-border shadow-none lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {customer.notes}
              </p>
            </CardContent>
          </Card>
        )}

      </div>

      {/* ── Confirm Delete ── */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false })}
        onConfirm={handleDelete}
        title="Delete Customer"
        description={`"${customer.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        loading={actionLoading}
        danger
      />
    </div>
  );
};

export default CustomerDetails;