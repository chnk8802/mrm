import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerUpdateSchema } from '@repo/validators';
import { ArrowLeft, Building, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import customerService from '@/api/customerService';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const customerTypes = [
  { value: 'individual', icon: Users,    label: 'Individual', description: 'Personal customer'            },
  { value: 'business',   icon: Building, label: 'Business',   description: 'Corporate / business customer' },
];

// ─── FieldError ───────────────────────────────────────────────────────────────

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-500 mt-1">{message}</p> : null;

// ─── CustomerEdit ─────────────────────────────────────────────────────────────

const CustomerEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(customerUpdateSchema) });

  const selectedType = watch('customerType');

  // ── Fetch & pre-fill ───────────────────────────────────────────────────────

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await customerService.getCustomerById(id);
        const c = response.data;
        reset({
          customerType: c.customerType || 'individual',
          name:         c.name         || '',
          phone:        c.phone        || '',
          email:        c.email        || '',
          notes:        c.notes        || '',
          address: {
            street:     c.address?.street     || '',
            city:       c.address?.city       || '',
            state:      c.address?.state      || '',
            postalCode: c.address?.postalCode || '',
            country:    c.address?.country    || '',
          },
        });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch customer');
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data) => {
    try {
      // Strip empty address fields before sending
      const address = Object.fromEntries(
        Object.entries(data.address || {}).filter(([, v]) => v !== '' && v !== undefined)
      );
      const payload = {
        ...data,
        ...(Object.keys(address).length > 0 ? { address } : {}),
      };
      await customerService.updateCustomer(id, payload);
      toast.success('Customer updated successfully');
      navigate(`/customers/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update customer');
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Loading customer data...
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 p-4 pb-20 md:pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/customers/${id}`)}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <h1 className="text-base font-semibold text-foreground">Edit Customer</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Customer Type ── */}
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Customer Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customerTypes.map(({ value, icon: Icon, label, description }) => (
                <label key={value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedType === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    value={value}
                    {...register('customerType')}
                    className="mt-0.5 accent-primary"
                  />
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${selectedType === value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className={`text-sm font-medium ${selectedType === value ? 'text-primary' : 'text-foreground'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                </label>
              ))}
              <FieldError message={errors.customerType?.message} />
            </CardContent>
          </Card>

          {/* ── Basic Information ── */}
          <Card className="border-border shadow-none lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="md:col-span-2">
                  <Label className="text-xs">Customer Name <span className="text-red-500">*</span></Label>
                  <Input {...register('name')} placeholder="Enter customer name"
                    className={`mt-1 h-8 text-sm ${errors.name ? 'border-red-500' : ''}`}
                  />
                  <FieldError message={errors.name?.message} />
                </div>

                <div>
                  <Label className="text-xs">Phone Number</Label>
                  <Input {...register('phone')} type="tel" placeholder="Enter phone number"
                    className={`mt-1 h-8 text-sm ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  <FieldError message={errors.phone?.message} />
                </div>

                <div>
                  <Label className="text-xs">Email Address</Label>
                  <Input {...register('email')} type="email" placeholder="Enter email address"
                    className={`mt-1 h-8 text-sm ${errors.email ? 'border-red-500' : ''}`}
                  />
                  <FieldError message={errors.email?.message} />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Address</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div className="md:col-span-2">
                    <Input {...register('address.street')} placeholder="Street address" className="h-8 text-sm" />
                  </div>
                  <Input {...register('address.city')}       placeholder="City"        className="h-8 text-sm" />
                  <Input {...register('address.state')}      placeholder="State"       className="h-8 text-sm" />
                  <Input {...register('address.postalCode')} placeholder="Postal code" className="h-8 text-sm" />
                  <Input {...register('address.country')}    placeholder="Country"     className="h-8 text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Notes ── */}
          <Card className="border-border shadow-none lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea {...register('notes')}
                placeholder="Add any additional notes about this customer..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
              <FieldError message={errors.notes?.message} />
            </CardContent>
          </Card>

        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/customers/${id}`)}>
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

export default CustomerEdit;