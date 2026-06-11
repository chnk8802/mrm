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
  User,
  Power,
  PowerOff,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import supplierService from '@/api/supplierService';
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
  if (typeof address === 'string') return address;
  const parts = [address.street, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean);
  return parts.length ? parts.join(', ') : null;
};

// ─── SupplierDetails ──────────────────────────────────────────────────────────

const SupplierDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [supplier, setSupplier]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setLoading(true);
        const response = await supplierService.getSupplierById(id);
        setSupplier(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch supplier');
      } finally {
        setLoading(false);
      }
    };
    fetchSupplier();
  }, [id]);

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await supplierService.deleteSupplier(id);
      toast.success('Supplier deleted');
      navigate('/suppliers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete supplier');
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, type: null });
    }
  };

  const handleToggleActive = async () => {
    try {
      setActionLoading(true);
      await supplierService.updateSupplier(id, { isActive: !supplier.isActive });
      toast.success(`Supplier ${supplier.isActive ? 'deactivated' : 'activated'}`);
      setSupplier((prev) => ({ ...prev, isActive: !prev.isActive }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, type: null });
    }
  };

  // ── States ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Loading supplier details...
    </div>
  );

  if (error) return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/suppliers')} className="gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>
      <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded-lg text-sm">
        {error}
      </div>
    </div>
  );

  if (!supplier) return null;

  const address = formatAddress(supplier.address);

  return (
    <div className="space-y-4 p-4 pb-24 md:pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/suppliers')}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Suppliers
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate(`/suppliers/${id}/edit`)} className="h-8 gap-1.5">
            <Edit className="w-3.5 h-3.5" /> Edit
          </Button>
          <RowActions
            actions={[
              {
                label: supplier.isActive ? 'Deactivate' : 'Activate',
                icon: supplier.isActive ? PowerOff : Power,
                onClick: () => setConfirmDialog({ open: true, type: supplier.isActive ? 'deactivate' : 'activate' }),
              },
              {
                label: 'Delete',
                icon: Trash2,
                danger: true,
                divider: true,
                onClick: () => setConfirmDialog({ open: true, type: 'delete' }),
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
              {supplier.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate">
                {supplier.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                  supplier.isActive
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </span>
                {supplier.address?.city && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {supplier.address.city}
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
            <InfoRow icon={Phone} label="Phone"           value={supplier.phone} />
            <InfoRow icon={Mail}  label="Email"           value={supplier.email} />
            <InfoRow icon={MapPin} label="Address"        value={address} />
          </CardContent>
        </Card>

        {/* ── Financial Information ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Receipt} label="Outstanding Balance" value={`₹ ${supplier.outstandingBalance}`} />
          </CardContent>
        </Card>

        {/* ── Record Information ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Record Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Calendar} label="Created"      value={formatDate(supplier.createdAt)} />
            <InfoRow icon={Calendar} label="Last Updated" value={formatDate(supplier.updatedAt)} />
          </CardContent>
        </Card>

        {/* ── Notes (full width, only if present) ── */}
        {supplier.notes && (
          <Card className="border-border shadow-none lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {supplier.notes}
              </p>
            </CardContent>
          </Card>
        )}

      </div>

      {/* ── Confirm: Delete ── */}
      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === 'delete'}
        onClose={() => setConfirmDialog({ open: false, type: null })}
        onConfirm={handleDelete}
        title="Delete Supplier"
        description={`"${supplier.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        loading={actionLoading}
        danger
      />

      {/* ── Confirm: Toggle Active ── */}
      <ConfirmDialog
        open={confirmDialog.open && (confirmDialog.type === 'deactivate' || confirmDialog.type === 'activate')}
        onClose={() => setConfirmDialog({ open: false, type: null })}
        onConfirm={handleToggleActive}
        title={confirmDialog.type === 'deactivate' ? 'Deactivate Supplier' : 'Activate Supplier'}
        description={
          confirmDialog.type === 'deactivate'
            ? 'This supplier will be marked as inactive.'
            : 'This supplier will be marked as active.'
        }
        confirmLabel={confirmDialog.type === 'deactivate' ? 'Deactivate' : 'Activate'}
        danger={confirmDialog.type === 'deactivate'}
        loading={actionLoading}
      />
    </div>
  );
};

export default SupplierDetails;