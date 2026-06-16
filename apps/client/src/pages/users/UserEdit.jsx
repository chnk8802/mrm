import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userUpdateSchema } from "@repo/validators";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import userService from "@/api/userService";
import toast from "react-hot-toast";

const FieldError = ({ message }) => message
    ? <p className="text-xs text-red-500 mt-1">{message}</p>
    : null;

const UserEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({ resolver: zodResolver(userUpdateSchema) });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await userService.getUserById(id);
                const user = response.data;
                reset({
                    name: user.name || '',
                    phone: user.phone || '',
                    address: {
                        street: user.address?.street || '',
                        city: user.address?.city || '',
                        state: user.address?.state || '',
                        postalCode: user.address?.postalCode || '',
                        country: user.address?.country || '',
                    }
                });
            } catch (err) {
                const errorData = err.response?.data;

                if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                    toast.error(errorData.errors[0].message);
                } else {
                    toast.error(errorData?.message || 'Failed to fetch user');
                }
                navigate('/app/users');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

    const onSubmit = async (data) => {
        try {
            await userService.updateUser(id, data);
            toast.success("User updated successfully");
            navigate(`/app/users/${id}`);
        } catch (err) {
            const errorData = err.response?.data;

            if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                toast.error(errorData.errors[0].message);
            } else {
                toast.error(errorData?.message || 'Failed to update user');
            }
        }
    };

    const handlePasswordReset = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        try {
            setPasswordLoading(true);
            await userService.resetPassword(id, newPassword);
            toast.success("Password updated successfully");
            setNewPassword('');
        } catch (err) {
            const errorData = err.response?.data;

            if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                toast.error(errorData.errors[0].message);
            } else {
                toast.error(errorData?.message || 'Failed to update password');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
            Loading user data...
        </div>
    );

    return (
        <div className="space-y-4 p-4 pb-20 md:pb-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/app/users/${id}`)}
                    className="gap-1.5 text-muted-foreground"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <h1 className="text-base font-semibold text-foreground">Edit User</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Basic Info */}
                    <Card className="border-border shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-xs">Full Name <span className="text-red-500">*</span></Label>
                                <Input {...register('name')} placeholder="Enter full name"
                                    className={`mt-1 h-8 text-sm ${errors.name ? 'border-red-500' : ''}`}
                                />
                                <FieldError message={errors.name?.message} />
                            </div>
                            <div>
                                <Label className="text-xs">Phone <span className="text-red-500">*</span></Label>
                                <Input {...register('phone')} type="tel" placeholder="Enter phone number"
                                    className={`mt-1 h-8 text-sm ${errors.phone ? 'border-red-500' : ''}`}
                                />
                                <FieldError message={errors.phone?.message} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address */}
                    <Card className="border-border shadow-none">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Address</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Input {...register('address.street')} placeholder="Street address" className="h-8 text-sm" />
                            <div className="grid grid-cols-2 gap-3">
                                <Input {...register('address.city')} placeholder="City" className="h-8 text-sm" />
                                <Input {...register('address.state')} placeholder="State" className="h-8 text-sm" />
                                <Input {...register('address.postalCode')} placeholder="Postal code" className="h-8 text-sm" />
                                <Input {...register('address.country')} placeholder="Country" className="h-8 text-sm" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/app/users/${id}`)}>
                        Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>

            {/* Password Reset — separate from main form */}
            <Card className="border-border shadow-none">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Reset Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-3 max-w-sm">
                        <div className="flex-1">
                            <Label className="text-xs">New Password</Label>
                            <div className="relative mt-1">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="h-8 text-sm pr-9"
                                />
                                <button type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>
                        <Button size="sm" variant="outline" className="h-8"
                            onClick={handlePasswordReset}
                            disabled={passwordLoading || !newPassword}
                        >
                            {passwordLoading ? 'Updating...' : 'Update'}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Leave blank to keep current password.</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserEdit;