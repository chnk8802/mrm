import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { repairSchema } from '@repo/validators';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AsyncCombobox } from '@/components/AsyncComboBox';
import customerService from '@/api/customerService';
import userService from '@/api/userService';
import repairService from '@/api/repairService';
import toast from 'react-hot-toast';
import CreateCustomerDialog from './components/Createcustomerdialog';
import DatePicker from '@/components/common/DatePicker';

// ─── FieldError ───────────────────────────────────────────────────────────────

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-500 mt-1">{message}</p> : null;

// ─── Fetch helpers ────────────────────────────────────────────────────────────

const fetchCustomers = async (search) => {
  const res = await customerService.getCustomers({ search, limit: 5 });
  return (res.data || []).map((c) => ({
    value: c._id,
    label: `${c.name} — ${c.phone || c.email || c.customerType}`,
  }));
};

const fetchTechnicians = async (search) => {
  const res = await userService.getUsers({ role: 'staff', search, limit: 5, isActive: true });
  return (res.data || []).map((t) => ({
    value: t._id,
    label: t.name,
  }));
};

// ─── RepairCreate ─────────────────────────────────────────────────────────────

const RepairCreate = () => {
  const navigate = useNavigate();
  const [createCustomerDialog, setCreateCustomerDialog] = useState({ open: false, name: '' });
  const [newCustomerLabel, setNewCustomerLabel] = useState('');
  const [dueDate, setDueDate] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(repairSchema),
    defaultValues: {},
  });

  const onSubmit = async (data) => {
    const finalServiceCharge = Number(data.serviceCharge);
    const finalDiscount = data.discount && !isNaN(data.discount) ? Number(data.discount) : 0;

    if (finalDiscount > finalServiceCharge) {
      toast.error('Discount cannot be greater than service charge');
      return;
    }
    try {
      const payload = {
        customer: data.customer,
        deviceModel: data.deviceModel,
        problem: data.problem,
        serviceCharge: Number(data.serviceCharge),
        ...(data.technician ? { technician: data.technician } : {}),
        ...(data.imei ? { imei: data.imei } : {}),
        ...(data.accessories ? { accessories: data.accessories } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
        ...(data.dueDate ? { dueDate: data.dueDate } : {}),
        ...(finalDiscount > 0 ? { discount: finalDiscount } : {}),
      };

      await repairService.createRepair(payload);
      toast.success('Repair order created');
      navigate('/app/repairs');
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to create repair');
      }
    }
  };

  return (
    <div className="space-y-4 p-4 pb-20 md:pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/repairs')}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Repairs
        </Button>
        <h1 className="text-base font-semibold text-foreground">New Repair</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Customer & Technician ── */}
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div>
                <Label className="text-xs">
                  Customer <span className="text-red-500">*</span>
                </Label>
                <div className="mt-1">
                  <Controller
                    name="customer"
                    control={control}
                    render={({ field }) => (
                      <AsyncCombobox
                        value={field.value}
                        onChange={field.onChange}
                        fetchOptions={fetchCustomers}
                        initialLabel={newCustomerLabel}
                        placeholder="Search customers..."
                        error={!!errors.customer}
                        onCreateNew={(prefillName) => {
                          setCreateCustomerDialog({ open: true, name: prefillName });
                        }}
                        createLabel="Create customer"
                      />
                    )}
                  />
                </div>
                <FieldError message={errors.customer?.message} />
              </div>

              <div>
                <Label className="text-xs">Technician</Label>
                <div className="mt-1">
                  <Controller
                    name="technician"
                    control={control}
                    render={({ field }) => (
                      <AsyncCombobox
                        value={field.value}
                        onChange={field.onChange}
                        fetchOptions={fetchTechnicians}
                        placeholder="Search technicians..."
                        error={!!errors.technician}
                      />
                    )}
                  />
                </div>
                <FieldError message={errors.technician?.message} />
              </div>

              <div>
                <DatePicker
                  className='w-full'
                  label="Due Date"
                  value={dueDate}
                  onChange={(date) => { setDueDate(date); setValue('dueDate', date); }}
                  disabledDates={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                    placeholder="15-digit IMEI (optional)"
                    className={`mt-1 h-8 text-sm ${errors.imei ? 'border-red-500' : ''}`}
                  />
                  <FieldError message={errors.imei?.message} />
                </div>
              </div>

              <div>
                <Label className="text-xs">
                  Problem Description <span className="text-red-500">*</span>
                </Label>
                <textarea
                  {...register('problem')}
                  placeholder="Describe the issue with the device..."
                  rows={3}
                  className={`mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none ${errors.problem ? 'border-red-500' : ''}`}
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
                    placeholder="0.00"
                    className={`mt-1 h-8 text-sm ${errors.serviceCharge ? 'border-red-500' : ''}`}
                  />
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
                    placeholder="0.00"
                    className="mt-1 h-8 text-sm"
                  />
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
              <textarea
                {...register('notes')}
                placeholder="Internal notes..."
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
              <FieldError message={errors.notes?.message} />
            </CardContent>
          </Card>

        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate('/app/repairs')}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Repair'}
          </Button>
        </div>
      </form>
      <CreateCustomerDialog
        open={createCustomerDialog.open}
        defaultName={createCustomerDialog.name}
        onClose={() => setCreateCustomerDialog({ open: false, name: '' })}
        onCreated={(newCustomer) => {
          setValue('customer', newCustomer._id);
          setNewCustomerLabel(`${newCustomer.name} — ${newCustomer.phone || newCustomer.customerType}`);
          setCreateCustomerDialog({ open: false, name: '' });
        }}
      />
    </div>
  );
};

export default RepairCreate;