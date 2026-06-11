import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { repairUpdateSchema } from '@repo/validators';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AsyncCombobox } from '@/components/AsyncComboBox';
import customerService from '@/api/customerService';
import userService from '@/api/userService';
import repairService from '@/api/repairService';
import toast from 'react-hot-toast';

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
  return (res.data || []).map((t) => ({ value: t._id, label: t.name }));
};

// ─── RepairEdit ───────────────────────────────────────────────────────────────

const RepairEdit = () => {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [loading, setLoading]   = useState(true);
  const [dueDate, setDueDate]   = useState(null);

  // Pre-fill labels for AsyncCombobox (so selected value shows name, not just ID)
  const [customerLabel, setCustomerLabel]     = useState('');
  const [technicianLabel, setTechnicianLabel] = useState('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(repairUpdateSchema) });

  // ── Fetch & pre-fill ───────────────────────────────────────────────────────

  useEffect(() => {
    const fetchRepair = async () => {
      try {
        const response = await repairService.getRepairById(id);
        const r = response.data;

        // Store labels so AsyncCombobox shows the name
        if (r.customer) setCustomerLabel(`${r.customer.name} — ${r.customer.phone || r.customer.customerType}`);
        if (r.technician) setTechnicianLabel(r.technician.name);

        // Pre-fill dueDate state for the calendar
        if (r.dueDate) setDueDate(new Date(r.dueDate));

        reset({
          customer:      r.customer?._id  || '',
          technician:    r.technician?._id || '',
          deviceModel:   r.deviceModel    || '',
          imei:          r.imei           || '',
          problem:       r.problem        || '',
          accessories:   r.accessories    || '',
          serviceCharge: r.serviceCharge  ?? undefined,
          discount:      r.discount       ?? undefined,
          notes:         r.notes          || '',
          dueDate:       r.dueDate ? new Date(r.dueDate) : undefined,
        });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch repair');
        navigate('/repairs');
      } finally {
        setLoading(false);
      }
    };
    fetchRepair();
  }, [id]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data) => {
    try {
      const payload = {
        customer:    data.customer,
        deviceModel: data.deviceModel,
        problem:     data.problem,
        serviceCharge: Number(data.serviceCharge),
        ...(data.technician  ? { technician:  data.technician       } : {}),
        ...(data.imei        ? { imei:        data.imei             } : {}),
        ...(data.accessories ? { accessories: data.accessories      } : {}),
        ...(data.notes       ? { notes:       data.notes            } : {}),
        ...(data.dueDate     ? { dueDate:     data.dueDate          } : {}),
        ...(data.discount    ? { discount:    Number(data.discount) } : {}),
      };

      await repairService.updateRepair(id, payload);
      toast.success('Repair updated successfully');
      navigate(`/repairs/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update repair');
    }
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
        <Button variant="ghost" size="sm" onClick={() => navigate(`/repairs/${id}`)}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <h1 className="text-base font-semibold text-foreground">Edit Repair</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Assignment ── */}
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
                        placeholder="Search customers..."
                        initialLabel={customerLabel}
                        error={!!errors.customer}
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
                        initialLabel={technicianLabel}
                        error={!!errors.technician}
                      />
                    )}
                  />
                </div>
                <FieldError message={errors.technician?.message} />
              </div>

              <div>
                <Label className="text-xs">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={`mt-1 h-8 w-full justify-start text-sm font-normal ${!dueDate ? 'text-muted-foreground' : ''}`}
                    >
                      <CalendarIcon className="w-3.5 h-3.5 mr-2 shrink-0" />
                      {dueDate ? format(dueDate, 'dd MMM yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        setValue('dueDate', date);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                    {...register('discount', { valueAsNumber: true })}
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
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/repairs/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RepairEdit;