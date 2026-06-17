import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import customerService from '@/api/customerService';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { customerSchema } from '@repo/validators';

const quickCustomerSchema = customerSchema.pick({
    customerType: true,
    name: true,
    phone: true,
    address: true,
});

const FieldError = ({ message }) =>
    message ? <p className="text-xs text-red-500 mt-1">{message}</p> : null;

const customerTypes = [
    { value: 'individual', icon: Users, label: 'Individual' },
    { value: 'business', icon: Building, label: 'Business' },
];

const CreateCustomerDialog = ({ open, onClose, onCreated, defaultName = '' }) => {
    const form = useForm({
        resolver: zodResolver(quickCustomerSchema),
        defaultValues: { customerType: 'individual', name: defaultName, phone: '', address: {} },
        });

    const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = form;

    useEffect(() => {
    setValue('name', defaultName);
}, [defaultName]);

    const selectedType = watch('customerType');

    const onSubmit = async (data) => {
        try {
            // Drop empty phone/address fields so we don't send blank strings
            const payload = {
                customerType: data.customerType,
                name: data.name,
                ...(data.phone ? { phone: data.phone } : {}),
                ...(Object.values(data.address || {}).some(Boolean) ? { address: data.address } : {}),
            };

            const res = await customerService.createCustomer(payload);
            const newCustomer = res.data;
            toast.success('Customer created');
            onCreated(newCustomer);
            reset();
            onClose();
        } catch (err) {
            const errorData = err.response?.data;
            console.error('CreateCustomerDialog error:', err);
            if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                toast.error(errorData.errors[0].message);
            } else {
                toast.error(errorData?.message || 'Failed to create customer');
            }
        }
    };

    const handleClose = () => { reset(); onClose(); };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-base font-semibold">New Customer</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">

                    {/* Type */}
                    <div className="grid grid-cols-2 gap-2">
                        {customerTypes.map(({ value, icon: Icon, label }) => (
                            <label key={value}
                                className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${selectedType === value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-muted/50'
                                    }`}
                            >
                                <input type="radio" value={value} {...register('customerType')} className="sr-only" />
                                <Icon className={`w-3.5 h-3.5 shrink-0 ${selectedType === value ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className={`text-xs font-medium ${selectedType === value ? 'text-primary' : 'text-foreground'}`}>
                                    {label}
                                </span>
                            </label>
                        ))}
                    </div>

                    {/* Name */}
                    <div>
                        <Label className="text-xs">Name <span className="text-red-500">*</span></Label>
                        <Input
                            {...register('name')}
                            placeholder="Enter customer name"
                            className={`mt-1 h-8 text-sm ${errors.name ? 'border-red-500' : ''}`}
                            autoFocus
                        />
                        <FieldError message={errors.name?.message} />
                    </div>

                    {/* Phone */}
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

                    {/* Address */}
                    <div className="space-y-3 pt-1 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">Address</p>

                        <div>
                            <Label className="text-xs">Street</Label>
                            <Input
                                {...register('address.street')}
                                placeholder="Street address"
                                className="mt-1 h-8 text-sm"
                            />
                            <FieldError message={errors.address?.street?.message} />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs">City</Label>
                                <Input
                                    {...register('address.city')}
                                    placeholder="City"
                                    className="mt-1 h-8 text-sm"
                                />
                                <FieldError message={errors.address?.city?.message} />
                            </div>
                            <div>
                                <Label className="text-xs">State</Label>
                                <Input
                                    {...register('address.state')}
                                    placeholder="State"
                                    className="mt-1 h-8 text-sm"
                                />
                                <FieldError message={errors.address?.state?.message} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs">Postal Code</Label>
                                <Input
                                    {...register('address.postalCode')}
                                    placeholder="Postal code"
                                    className="mt-1 h-8 text-sm"
                                />
                                <FieldError message={errors.address?.postalCode?.message} />
                            </div>
                            <div>
                                <Label className="text-xs">Country</Label>
                                <Input
                                    {...register('address.country')}
                                    placeholder="Country"
                                    className="mt-1 h-8 text-sm"
                                />
                                <FieldError message={errors.address?.country?.message} />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClose}
                            className="text-foreground hover:text-foreground border-border"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Customer'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateCustomerDialog;