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

// Minimal schema — only what's needed for a walk-in
const quickCustomerSchema = z.object({
    customerType: z.enum(['individual', 'business']),
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
});

const FieldError = ({ errors }) =>
    errors ? <p className="text-xs text-red-500 mt-1">{errors?.message}</p> : null;

const customerTypes = [
    { value: 'individual', icon: Users, label: 'Individual' },
    { value: 'business', icon: Building, label: 'Business' },
];

const CreateCustomerDialog = ({ open, onClose, onCreated, defaultName = '' }) => {
    const form = useForm({
        resolver: zodResolver(quickCustomerSchema),
        defaultValues: { customerType: 'individual', name: defaultName, phone: '' },
        values: { customerType: 'individual', name: defaultName, phone: '' }, // sync when defaultName changes
    })
    const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = form;

    const selectedType = watch('customerType');

    const onSubmit = async (data) => {
        try {
            const res = await customerService.createCustomer(data);
            const newCustomer = res.data.data;
            toast.success('Customer created');
            onCreated(newCustomer);   // pass back to RepairForm to set the combobox value
            reset();
            onClose();
        } catch (err) {
            handleApiError(err, 'Failed to create customer');
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