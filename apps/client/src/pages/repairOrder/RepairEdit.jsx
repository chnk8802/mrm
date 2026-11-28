import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { repairUpdateSchema } from '@repo/validators';
import { ArrowLeft, User, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import repairService from '@/api/repairService';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import DateTimePicker from '@/components/common/DateTimePicker';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Textarea } from '@/components/ui/textarea';

// ─── FieldError ───────────────────────────────────────────────────────────────

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-500 mt-1">{message}</p> : null;

// ─── ReadOnlyRow (for customer/technician display) ─────────────────────────────

const ReadOnlyRow = ({ icon: Icon, label, value, sub }) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <div className="mt-1 flex items-center gap-2 h-8 px-3 rounded-md border border-input bg-muted/30 text-sm">
      <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <span className="text-foreground truncate">{value || '—'}</span>
      {sub && <span className="text-xs text-muted-foreground ml-auto shrink-0">{sub}</span>}
    </div>
  </div>
);

// ─── RepairEdit ───────────────────────────────────────────────────────────────

const RepairEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [dueDate, setDueDate] = useState(null);
  // Read-only display info — not part of the editable form
  const [customerInfo, setCustomerInfo] = useState(null);
  const [technicianInfo, setTechnicianInfo] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [repairIdLabel, setRepairIdLabel] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const [partsCost, setPartsCost] = useState(0);
  const [lossConfirm, setLossConfirm] = useState({ open: false, data: null });
  const [saving, setSaving] = useState(false);

  useDocumentTitle(repairIdLabel || 'Edit Repair');

  const {
    register, handleSubmit, setValue, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(repairUpdateSchema) });

  const serviceChargeValue = watch('serviceCharge');
  const discountValue = watch('discount');
  const hasPayments = amountPaid > 0;
  const maxDiscount = Math.max(0, (Number(serviceChargeValue) || 0) - amountPaid);
  const netAfterDiscount = (Number(serviceChargeValue) || 0) - (Number(discountValue) || 0);
  const expectedLoss = partsCost - netAfterDiscount; // > 0 means loss

  // ── Fetch & pre-fill ───────────────────────────────────────────────────────

  useEffect(() => {
    const fetchRepair = async () => {
      try {
        const response = await repairService.getRepairById(id);
        const r = response.data;
        setRepairIdLabel(r.repairId || null);
        const locked = ['completed', 'cancelled', 'not-repairable'].includes(r.status);
        setIsLocked(locked);
        setAmountPaid(r.amountPaid ?? 0);
        setPartsCost(
          (r.sparePartUsage || []).reduce((s, p) => s + (p.quantity ?? 1) * (p.unitCost ?? 0), 0)
        );

        setCustomerInfo(r.customer || null);
        setTechnicianInfo(r.technician || null);

        if (r.dueDate) setDueDate(new Date(r.dueDate));

        reset({
          deviceModel: r.deviceModel || '',
          imei: r.imei || '',
          problem: r.problem || '',
          accessories: r.accessories || '',
          serviceCharge: r.serviceCharge ?? undefined,
          discount: r.discount ?? undefined,
          notes: r.notes || '',
          dueDate: r.dueDate ? new Date(r.dueDate) : undefined,
        });
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

  // ── Submit ─────────────────────────────────────────────────────────────────

  const saveRepair = async (data) => {
    const finalServiceCharge = Number(data.serviceCharge);
    const finalDiscount = data.discount && !isNaN(data.discount) ? Number(data.discount) : 0;

    try {
      setSaving(true);
      const payload = {
        deviceModel: data.deviceModel,
        problem: data.problem,
        serviceCharge: finalServiceCharge,
        discount: finalDiscount, // always send, so it can be lowered to 0
        ...(data.imei ? { imei: data.imei } : {}),
        ...(data.accessories ? { accessories: data.accessories } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
        ...(data.dueDate ? { dueDate: data.dueDate } : {}),
      };

      await repairService.updateRepair(id, payload);
      toast.success('Repair updated successfully');
      navigate(`/app/repairs/${id}`);
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to update repair');
      }
    } finally {
      setSaving(false);
      setLossConfirm({ open: false, data: null });
    }
  };

  const onSubmit = async (data) => {
    const finalServiceCharge = Number(data.serviceCharge);
    const finalDiscount = data.discount && !isNaN(data.discount) ? Number(data.discount) : 0;

    if (finalDiscount > finalServiceCharge - amountPaid) {
      toast.error(`Discount cannot exceed the remaining balance (₹${finalServiceCharge - amountPaid})`);
      return;
    }

    const net = finalServiceCharge - finalDiscount;
    if (partsCost - net > 0) {
      setLossConfirm({ open: true, data }); // wait for the dialog
      return;
    }

    await saveRepair(data);
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Loading repair data...
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 p-4 pb-20 md:pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/app/repairs/${id}`)}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <h1 className="text-base font-semibold text-foreground">Edit Repair</h1>
      </div>

      {isLocked && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 px-3 py-2 rounded-lg text-sm">
          This repair is closed and cannot be edited.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Assignment (read-only) ── */}
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <ReadOnlyRow
                icon={User}
                label="Customer"
                value={customerInfo?.name}
                sub={customerInfo?.phone || customerInfo?.customerType}
              />

              <ReadOnlyRow
                icon={Wrench}
                label="Technician"
                value={technicianInfo?.name || 'Not assigned'}
              />

              <div>
                <DateTimePicker
                  label="Due Date"
                  value={dueDate}
                  onChange={(date) => { setDueDate(date); setValue('dueDate', date); }}
                />
                <FieldError message={errors.dueDate?.message} />
              </div>

            </CardContent>
          </Card>

          {/* ── Device Information ── */}
          <Card className="border-border shadow-none lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Device Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">
                    Device Model <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register('deviceModel')}
                    placeholder="e.g. iPhone 14, Samsung S23"
                    className={`mt-1 h-8 text-sm ${errors.deviceModel ? 'border-red-500' : ''}`}
                  />
                  <FieldError message={errors.deviceModel?.message} />
                </div>

                <div>
                  <Label className="text-xs">IMEI</Label>
                  <Input
                    {...register('imei')}
                    placeholder="15-digit IMEI"
                    className={`mt-1 h-8 text-sm ${errors.imei ? 'border-red-500' : ''}`}
                  />
                  <FieldError message={errors.imei?.message} />
                </div>
              </div>

              <div>
                <Label className="text-xs">
                  Problem Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  {...register('problem')}
                  placeholder="Describe the issue with the device..."
                  rows={3}
                  error={!!errors.problem}
                  className="mt-1"
                  />
                <FieldError message={errors.problem?.message} />
              </div>

              <div>
                <Label className="text-xs">Accessories</Label>
                <Input
                  {...register('accessories')}
                  placeholder="e.g. Charger, Case, Box"
                  className="mt-1 h-8 text-sm"
                />
                <FieldError message={errors.accessories?.message} />
              </div>

            </CardContent>
          </Card>

          {/* ── Pricing ── */}
          <Card className="border-border shadow-none lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <Label className="text-xs">
                    Service Charge (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register('serviceCharge', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    readOnly={hasPayments}
                    placeholder="0.00"
                    className={`mt-1 h-8 text-sm ${errors.serviceCharge ? 'border-red-500' : ''} ${hasPayments ? 'bg-muted/40' : ''}`}
                  />
                  {hasPayments && (
                    <p className="text-xs text-muted-foreground mt-1">Locked: ₹{amountPaid} already paid</p>
                  )}
                  <FieldError message={errors.serviceCharge?.message} />
                </div>

                <div>
                  <Label className="text-xs">Discount (₹)</Label>
                  <Input
                    {...register('discount', {
                      setValueAs: (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    max={maxDiscount}
                    placeholder="0.00"
                    className="mt-1 h-8 text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Max: ₹{maxDiscount}</p>
                  {expectedLoss > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Parts cost ₹{partsCost}, you'd receive ₹{Math.max(0, netAfterDiscount)}: a loss of ₹{expectedLoss}.
                    </p>
                  )}
                  <FieldError message={errors.discount?.message} />
                </div>

              </div>
            </CardContent>
          </Card>

          {/* ── Notes ── */}
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register('notes')}
                placeholder="Internal notes..."
                rows={4}
                error={!!errors.notes}
                  className="mt-1"
                  />
              <FieldError message={errors.notes?.message} />
            </CardContent>
          </Card>

        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/app/repairs/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting || saving || isLocked}>
            {isSubmitting || saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* ── Confirm: loss-making discount ── */}
      <ConfirmDialog
        open={lossConfirm.open}
        onClose={() => setLossConfirm({ open: false, data: null })}
        onConfirm={() => saveRepair(lossConfirm.data)}
        title="This repair will make a loss"
        description={`Parts cost ₹${partsCost}, but you'd receive only ₹${Math.max(0, netAfterDiscount)} after the discount. Total loss: ₹${expectedLoss}. Save anyway?`}
        confirmLabel="Save anyway"
        loading={saving}
        danger
      />
    </div>
  );
};

export default RepairEdit;