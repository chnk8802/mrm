import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supplierSchema } from '@repo/validators';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import supplierService from '@/api/supplierService';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Textarea } from '@/components/ui/textarea';

// ─── FieldError ───────────────────────────────────────────────────────────────

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-500 mt-1">{message}</p> : null;

// ─── SupplierCreate ───────────────────────────────────────────────────────────

const SupplierCreate = () => {
  const navigate = useNavigate();
  useDocumentTitle('Add Supplier');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      notes: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
    },
  });

  const onSubmit = async (data) => {
    try {
      // Strip empty address fields so strict() doesn't choke on empty strings
      const address = Object.fromEntries(
        Object.entries(data.address || {}).filter(([, v]) => v !== '' && v !== undefined)
      );

      // Build clean payload — omit empty optional strings
      const payload = {
        name: data.name,
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
        ...(Object.keys(address).length > 0 ? { address } : {}),
      };

      await supplierService.createSupplier(payload);
      toast.success('Supplier created successfully');
      navigate('/app/suppliers');
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to create supplier');
      }
    }
  };

  return (
    <div className="space-y-4 p-4 pb-20 md:pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/suppliers')}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Suppliers
        </Button>
        <h1 className="text-base font-semibold text-foreground">Add Supplier</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ── Basic Information ── */}
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div>
                <Label className="text-xs">
                  Supplier Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register('name')}
                  placeholder="Enter supplier name"
                  className={`mt-1 h-8 text-sm ${errors.name ? 'border-red-500' : ''}`}
                />
                <FieldError message={errors.name?.message} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    {...register('phone')}
                    type="tel"
                    placeholder="Enter phone number"
                    className={`mt-1 h-8 text-sm ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  <FieldError message={errors.phone?.message} />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="Enter email address"
                    className={`mt-1 h-8 text-sm ${errors.email ? 'border-red-500' : ''}`}
                  />
                  <FieldError message={errors.email?.message} />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* ── Address ── */}
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                {...register('address.street')}
                placeholder="Street address"
                className="h-8 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input {...register('address.city')} placeholder="City" className="h-8 text-sm" />
                <Input {...register('address.state')} placeholder="State" className="h-8 text-sm" />
                <Input {...register('address.postalCode')} placeholder="Postal code" className="h-8 text-sm" />
                <Input {...register('address.country')} placeholder="Country" className="h-8 text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* ── Notes ── */}
          <Card className="border-border shadow-none lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register('notes')}
                placeholder="Add any additional notes about this supplier..."
                rows={3}
                error={!!errors.notes}
                  className="mt-1"/>
              <FieldError message={errors.notes?.message} />
            </CardContent>
          </Card>

        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate('/app/suppliers')}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Supplier'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SupplierCreate;