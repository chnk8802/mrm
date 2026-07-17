import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supplierUpdateSchema } from '@repo/validators';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import supplierService from '@/api/supplierService';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// ─── FieldError ───────────────────────────────────────────────────────────────

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-500 mt-1">{message}</p> : null;

// ─── SupplierEdit ─────────────────────────────────────────────────────────────

const SupplierEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState('true');
  const [supplierName, setSupplierName] = useState(null);
  useDocumentTitle(supplierName || 'Edit Supplier');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(supplierUpdateSchema) });

  // ── Fetch & pre-fill ───────────────────────────────────────────────────────

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await supplierService.getSupplierById(id);
        const s = response.data;
        setSupplierName(s.name || null);
        setIsActive(s.isActive !== false ? 'true' : 'false');
        reset({
          name: s.name || '',
          phone: s.phone || '',
          email: s.email || '',
          notes: s.notes || '',
          address: {
            street: s.address?.street || '',
            city: s.address?.city || '',
            state: s.address?.state || '',
            postalCode: s.address?.postalCode || '',
            country: s.address?.country || '',
          },
        });
      } catch (err) {
        const errorData = err.response?.data;

        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          toast.error(errorData.errors[0].message);
        } else {
          toast.error(errorData?.message || 'Failed to fetch supplier');
        }
        navigate('/app/suppliers');
      } finally {
        setLoading(false);
      }
    };
    fetchSupplier();
  }, [id]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data) => {
    try {
      const address = Object.fromEntries(
        Object.entries(data.address || {}).filter(([, v]) => v !== '' && v !== undefined)
      );

      const payload = {
        name: data.name,
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
        ...(Object.keys(address).length > 0 ? { address } : {}),
        isActive: isActive === 'true',
      };

      await supplierService.updateSupplier(id, payload);
      toast.success('Supplier updated successfully');
      navigate(`/app/suppliers/${id}`);
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to update supplier');
      }
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Loading supplier data...
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 p-4 pb-20 md:pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/app/suppliers/${id}`)}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <h1 className="text-base font-semibold text-foreground">Edit Supplier</h1>
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

              <div>
                <Label className="text-xs">Status</Label>
                <Select value={isActive} onValueChange={setIsActive}>
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" className="text-sm">Active</SelectItem>
                    <SelectItem value="false" className="text-sm">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
              <textarea
                {...register('notes')}
                placeholder="Add any additional notes about this supplier..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
              <FieldError message={errors.notes?.message} />
            </CardContent>
          </Card>

        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/app/suppliers/${id}`)}>
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

export default SupplierEdit;