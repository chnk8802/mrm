import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Wrench, Phone, Calendar,
  CheckCircle, Clock, AlertCircle, XCircle, PackageCheck,
  IndianRupee, Package, User, FileText, CircleDot, Plus, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import repairService from '@/api/repairService';
import userService from '@/api/userService';
import supplierService from '@/api/supplierService';
import sparePartUsageService from '@/api/sparePartUsageService';
import RowActions from '@/components/common/RowActions';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { AsyncCombobox } from '@/components/AsyncComboBox';
import toast from 'react-hot-toast';
import StatusUpdateDialog from './components/StatusUpdateDialog';
import AssignTechnicianDialog from './components/AssignTechnicianDialog';
import Can from '@/components/common/Can';
import { usePermission } from '@/hooks/usePermission';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS = {
  'received': ['in-progress', 'cancelled'],
  'in-progress': ['ready', 'not-repairable', 'cancelled'],
  'ready': [],
  'not-repairable': [],
  'completed': [],
  'cancelled': [],
};

const STATUS_LABELS = {
  'received': 'Received',
  'in-progress': 'In Progress',
  'ready': 'Ready',
  'not-repairable': 'Not Repairable',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
};

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

const formatDate = (d) => d ? format(new Date(d), 'dd MMM yyyy, hh:mm a') : null;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
    .format(amount ?? 0);

const getStatusBadge = (status) => {
  switch (status) {
    case 'received': return { icon: Clock, color: 'bg-yellow-500/10 text-yellow-500' };
    case 'in-progress': return { icon: Wrench, color: 'bg-blue-500/10 text-blue-500' };
    case 'ready': return { icon: PackageCheck, color: 'bg-purple-500/10 text-purple-500' };
    case 'not-repairable': return { icon: AlertCircle, color: 'bg-orange-500/10 text-orange-500' };
    case 'completed': return { icon: CheckCircle, color: 'bg-green-500/10 text-green-500' };
    case 'cancelled': return { icon: XCircle, color: 'bg-red-500/10 text-red-500' };
    default: return { icon: CircleDot, color: 'bg-muted text-muted-foreground' };
  }
};

const getPaymentBadge = (status) => {
  switch (status) {
    case 'paid': return 'bg-green-500/10 text-green-500';
    case 'partial-paid': return 'bg-yellow-500/10 text-yellow-500';
    case 'unpaid': return 'bg-red-500/10 text-red-500';
    case 'waived': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-500 mt-1">{message}</p> : null;

const fetchTechnicians = async (search) => {
  const res = await userService.getUsers({ role: 'staff', search, limit: 5, isActive: true });
  return (res.data || []).map((t) => ({ value: t._id, label: t.name }));
};

const fetchSuppliers = async (search) => {
  const res = await supplierService.getSuppliers({ search, limit: 5 });
  return (res.data || []).map((s) => ({ value: s._id, label: s.name }));
};

// ─── Spare Part Form (inline) ─────────────────────────────────────────────────

const defaultPartForm = { sparePart: '', quantity: 1, unitCost: '', supplier: '', notes: '' };

const SparePartForm = ({ repairId, onAdded, onCancel }) => {
  const [form, setForm] = useState(defaultPartForm);
  const [supplierId, setSupplierId] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.sparePart || form.sparePart.length < 3) e.sparePart = 'Min 3 characters';
    if (!form.quantity || form.quantity < 1) e.quantity = 'Min 1';
    if (form.unitCost === '' || form.unitCost < 0) e.unitCost = 'Required, min 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const payload = {
        repair: repairId,
        sparePart: form.sparePart,
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost),
        ...(supplierId ? { supplier: supplierId } : {}),
        ...(form.notes ? { notes: form.notes } : {}),
      };
      const response = await sparePartUsageService.createSparePartUsage(payload);
      toast.success('Spare part added');
      onAdded(response.data);
      setForm(defaultPartForm);
      setSupplierId('');
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to add spare part');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/20 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Spare Part</p>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Part Name <span className="text-red-500">*</span></Label>
          <Input
            value={form.sparePart}
            onChange={(e) => setForm((p) => ({ ...p, sparePart: e.target.value }))}
            placeholder="e.g. Screen, Battery"
            className={`mt-1 h-8 text-sm ${errors.sparePart ? 'border-red-500' : ''}`}
          />
          <FieldError message={errors.sparePart} />
        </div>

        <div>
          <Label className="text-xs">Supplier</Label>
          <div className="mt-1">
            <AsyncCombobox
              value={supplierId}
              onChange={setSupplierId}
              fetchOptions={fetchSuppliers}
              placeholder="Search suppliers..."
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Quantity <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
            className={`mt-1 h-8 text-sm ${errors.quantity ? 'border-red-500' : ''}`}
          />
          <FieldError message={errors.quantity} />
        </div>

        <div>
          <Label className="text-xs">Unit Cost (₹) <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.unitCost}
            onChange={(e) => setForm((p) => ({ ...p, unitCost: e.target.value }))}
            placeholder="0.00"
            className={`mt-1 h-8 text-sm ${errors.unitCost ? 'border-red-500' : ''}`}
          />
          <FieldError message={errors.unitCost} />
        </div>

        <div className="md:col-span-2">
          <Label className="text-xs">Notes</Label>
          <Input
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Optional notes..."
            className="mt-1 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="button" size="sm" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Adding...' : 'Add Part'}
        </Button>
      </div>
    </div>
  );
};

// ─── RepairDetails ────────────────────────────────────────────────────────────

const RepairDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { hasRole } = usePermission();

  const [repair, setRepair] = useState(null);
  const [spareParts, setSpareParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);

  const [dialog, setDialog] = useState({ open: false, type: null });
  const [deletePartId, setDeletePartId] = useState(null);

  const closeDialog = () => setDialog({ open: false, type: null });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchRepair = async () => {
      try {
        setLoading(true);
        const response = await repairService.getRepairById(id);
        const r = response.data;
        setRepair(r);
        setSpareParts(r.sparePartUsage || []);
      } catch (err) {
        const errorData = err.response?.data;
        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          toast.error(errorData.errors[0].message);
        } else {
          toast.error(errorData?.message || 'Failed to fetch repair');
        }
        navigate('/app/repairs');
      } finally {
        setLoading(false);
      }
    };
    fetchRepair();
  }, [id]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await repairService.deleteRepair(id);
      toast.success('Repair deleted');
      navigate('/app/repairs');
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to delete repair');
      }
    } finally {
      setActionLoading(false);
      closeDialog();
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      setActionLoading(true);
      const response = await repairService.updateRepairStatus(id, { status });
      setRepair(response.data);
      toast.success(`Status updated to "${STATUS_LABELS[status]}"`);
      closeDialog();
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to update status');
      }
    } finally {
      setActionLoading(false);
    }
  };


  // parent
  const handleAssignTechnician = async (technicianId) => {
    try {
      setActionLoading(true);
      const response = await repairService.assignTechnician(id, { technicianId });
      setRepair(response.data);
      toast.success('Technician assigned');
      closeDialog();
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to assign technician');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handlePickup = async () => {
    try {
      setActionLoading(true);
      const response = await repairService.pickupRepair(id, {});
      setRepair(response.data);
      toast.success('Device marked as picked up');
      closeDialog();
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to mark pickup');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handlePartAdded = (newPart) => {
    setSpareParts((prev) => [...prev, newPart]);
    setShowAddPart(false);
  };

  const handleDeletePart = async () => {
    try {
      await sparePartUsageService.deleteSparePartUsage(deletePartId);
      setSpareParts((prev) => prev.filter((p) => p._id !== deletePartId));
      toast.success('Spare part removed');
      setDeletePartId(null);
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to remove spare part');
      }
    }
  };

  // ── States ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Loading repair details...
    </div>
  );

  if (!repair) return null;

  const { icon: StatusIcon, color: statusColor } = getStatusBadge(repair.status);
  const allowedTransitions = ALLOWED_TRANSITIONS[repair.status] || [];
  const netAmount = (repair.serviceCharge ?? 0) - (repair.discount ?? 0);
  const balance = netAmount - (repair.amountPaid ?? 0);
  const canEditParts = repair.status === 'in-progress';
  const totalPartsCost = spareParts.reduce((sum, p) => sum + (p.quantity ?? 1) * (p.unitCost ?? 0), 0);

  return (
    <div className="space-y-4 p-4 pb-24 md:pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/repairs')}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Repairs
        </Button>
        <div className="flex items-center gap-2">
          <Can role="manager">
            <Button size="sm" onClick={() => navigate(`/app/repairs/${id}/edit`)} className="h-8 gap-1.5">
              <Edit className="w-3.5 h-3.5" /> Edit
            </Button>
          </Can>
          <RowActions
            actions={[
              ...(hasRole('manager') && repair.status === 'received' && !repair.technician ? [{
                label: 'Assign Technician',
                icon: User,
                onClick: () => setDialog({ open: true, type: 'assign' }),
              }] : []),
              ...(allowedTransitions.length > 0 ? [{
                label: 'Update Status',
                icon: CircleDot,
                onClick: () => setDialog({ open: true, type: 'status' }),
              }] : []),
              ...(['ready', 'not-repairable'].includes(repair.status) && !repair.isPickedUp ? [{
                label: 'Mark as Picked Up',
                icon: PackageCheck,
                onClick: () => setDialog({ open: true, type: 'pickup' }),
              }] : []),
              ...(hasRole('superadmin') ? [{
                label: 'Delete',
                icon: Trash2,
                danger: true,
                divider: true,
                onClick: () => setDialog({ open: true, type: 'delete' }),
              }] : []),
            ]}
          />
        </div>
      </div>

      {/* ── Profile Card ── */}
      <Card className="border-border shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground">{repair.repairId}</h2>
              <p className="text-sm text-muted-foreground truncate">{repair.deviceModel}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${statusColor}`}>
                  <StatusIcon className="w-3 h-3" />
                  {STATUS_LABELS[repair.status]}
                </span>
                <Can role="manager">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getPaymentBadge(repair.paymentStatus)}`}>
                    {repair.paymentStatus?.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </Can>
                {repair.isPickedUp && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-500">
                    Picked Up
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Device Info ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Device Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Wrench} label="Device Model" value={repair.deviceModel} />
            <InfoRow icon={CircleDot} label="IMEI" value={repair.imei} />
            <InfoRow icon={AlertCircle} label="Problem" value={repair.problem} />
            {repair.accessories && (
              <InfoRow icon={Package} label="Accessories" value={repair.accessories} />
            )}
          </CardContent>
        </Card>

        {/* ── Assignment ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="text-sm font-medium text-foreground">{repair.customer?.name || '—'}</p>
                {repair.customer?.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />{repair.customer.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wrench className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Technician</p>
                <p className="text-sm font-medium text-foreground">
                  {repair.technician?.name || 'Not assigned'}
                </p>
                {repair.technician?.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />{repair.technician.phone}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Pricing ── */}
        <Can role="manager">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={IndianRupee} label="Service Charge" value={formatCurrency(repair.serviceCharge)} />
              <InfoRow icon={IndianRupee} label="Discount" value={formatCurrency(repair.discount)} />
              <InfoRow icon={IndianRupee} label="Net Amount" value={formatCurrency(netAmount)} />
              <InfoRow icon={IndianRupee} label="Amount Paid" value={formatCurrency(repair.amountPaid)} />
              <div className="flex items-start gap-3">
                <IndianRupee className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Balance Due</p>
                  <p className={`text-sm font-semibold ${balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Can>

        {/* ── Spare Parts ── */}
        <Card className="border-border shadow-none lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                Spare Parts Used
              </CardTitle>
              {canEditParts && !showAddPart && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                  onClick={() => setShowAddPart(true)}
                >
                  <Plus className="w-3 h-3" /> Add Part
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">

            {/* Add form */}
            {showAddPart && (
              <SparePartForm
                repairId={id}
                onAdded={handlePartAdded}
                onCancel={() => setShowAddPart(false)}
              />
            )}

            {/* Parts list */}
            {spareParts.length > 0 ? (
              <>
                {spareParts.map((part) => (
                  <div key={part._id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{part.sparePart}</p>
                      <p className="text-xs text-muted-foreground">
                        {part.quantity} × {formatCurrency(part.unitCost)}
                        {part.supplier?.name && ` · ${part.supplier.name}`}
                      </p>
                      {part.notes && (
                        <p className="text-xs text-muted-foreground italic">{part.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency((part.quantity ?? 1) * (part.unitCost ?? 0))}
                      </p>
                      {canEditParts && (
                        <button
                          onClick={() => setDeletePartId(part._id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-border px-1">
                  <p className="text-xs font-medium text-muted-foreground">Total Parts Cost</p>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(totalPartsCost)}</p>
                </div>
              </>
            ) : (
              !showAddPart && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {canEditParts ? 'No spare parts added yet' : 'No spare parts used'}
                </p>
              )
            )}
          </CardContent>
        </Card>

        {/* ── Timeline ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Calendar} label="Created" value={formatDate(repair.createdAt)} />
            <InfoRow icon={Calendar} label="Last Updated" value={formatDate(repair.updatedAt)} />
            {repair.dueDate && (
              <InfoRow icon={Calendar} label="Due Date" value={formatDate(repair.dueDate)} />
            )}
            {repair.completedAt && (
              <InfoRow icon={CheckCircle} label="Completed" value={formatDate(repair.completedAt)} />
            )}
            {repair.pickedUpAt && (
              <InfoRow icon={PackageCheck} label="Picked Up" value={formatDate(repair.pickedUpAt)} />
            )}
          </CardContent>
        </Card>

        {/* ── Notes ── */}
        {repair.notes && (
          <Card className="border-border shadow-none lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {repair.notes}
              </p>
            </CardContent>
          </Card>
        )}

      </div>

      {/* ── Confirm: Delete Repair ── */}
      <ConfirmDialog
        open={dialog.open && dialog.type === 'delete'}
        onClose={closeDialog}
        onConfirm={handleDelete}
        title="Delete Repair"
        description={`Repair "${repair.repairId}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        loading={actionLoading}
        danger
      />

      {/* ── Confirm: Pickup ── */}
      <ConfirmDialog
        open={dialog.open && dialog.type === 'pickup'}
        onClose={closeDialog}
        onConfirm={handlePickup}
        title="Mark as Picked Up"
        description={
          repair.status === 'ready'
            ? 'Device will be marked as picked up and status will move to Completed.'
            : 'Device will be marked as picked up.'
        }
        confirmLabel="Confirm Pickup"
        loading={actionLoading}
        danger={false}
      />

      {/* ── Confirm: Delete Spare Part ── */}
      <ConfirmDialog
        open={!!deletePartId}
        onClose={() => setDeletePartId(null)}
        onConfirm={handleDeletePart}
        title="Remove Spare Part"
        description="This spare part will be removed from the repair. This cannot be undone."
        confirmLabel="Remove"
        danger
      />

      {/* ── Status Update Dialog ── */}
      {dialog.open && dialog.type === 'status' && (
        <StatusUpdateDialog
          open={dialog.open && dialog.type === 'status'}
          onClose={closeDialog}
          repair={repair}
          statusLabels={STATUS_LABELS}
          allowedTransitions={allowedTransitions}
          onUpdate={handleStatusUpdate}
          loading={actionLoading}
        />
      )}

      {/* ── Assign Technician Dialog ── */}
      {dialog.open && dialog.type === 'assign' && (
        <AssignTechnicianDialog
          open={dialog.open && dialog.type === 'assign'}
          onClose={closeDialog}
          repair={repair}
          fetchTechnicians={fetchTechnicians}
          onAssign={handleAssignTechnician}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default RepairDetails;