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
                    name:    user.name    || '',
                    phone:   user.phone   || '',
                    address: {
                        street:     user.address?.street     || '',
                        city:       user.address?.city       || '',
                        state:      user.address?.state      || '',
                        postalCode: user.address?.postalCode || '',
                        country:    user.address?.country    || '',
                    }
                });
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to fetch user");
                navigate('/users');
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
            navigate(`/users/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update user");
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
            toast.error(err.response?.data?.message || "Failed to update password");
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
                <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${id}`)}
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
                                <Input {...register('address.city')}       placeholder="City"        className="h-8 text-sm" />
                                <Input {...register('address.state')}      placeholder="State"       className="h-8 text-sm" />
                                <Input {...register('address.postalCode')} placeholder="Postal code" className="h-8 text-sm" />
                                <Input {...register('address.country')}    placeholder="Country"     className="h-8 text-sm" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/users/${id}`)}>
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

// import axios from "axios";
// import { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import {
//   ShieldCheck,
//   Shield,
//   ClipboardList,
//   UserCog,
//   Wrench,
//   Save,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import userService from "@/api/userService";
// import { useAuth } from "@/context/AuthContext";

// const UserEdit = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();

//   const { currentUser } = useAuth();

//   // Form state
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     address: "",
//     role: "staff",
//     newPassword: "",
//   });

//   // Error state
//   const [errors, setErrors] = useState({});

//   // Loading states
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);

//   // Fetch user data on mount
//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         setLoading(true);
//         const response = await userService.getUserById(id);
//         const user = response.data;

//         setFormData({
//           name: user.name || "",
//           email: user.email || "",
//           phone: user.phone || "",
//           address: user.address || "",
//           role: user.role || "staff",
//           newPassword: "",
//         });
//       } catch (err) {
//         setError(err.response?.data?.message || "Failed to fetch user");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, [id]);

//   // Handle input change
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));

//     // Clear error for this field
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: null }));
//     }
//   };

//   // Validate form
//   const validateForm = () => {
//     const newErrors = {};

//     // Name validation (required)
//     if (!formData.name.trim()) {
//       newErrors.name = "Name is required";
//     } else if (formData.name.trim().length < 2) {
//       newErrors.name = "Name must be at least 2 characters";
//     }

//     // Email validation (required)
//     if (!formData.email.trim()) {
//       newErrors.email = "Email is required";
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//       newErrors.email = "Invalid email address";
//     }

//     // Phone validation (required)
//     if (!formData.phone.trim()) {
//       newErrors.phone = "Phone number is required";
//     } else if (formData.phone.length < 10) {
//       newErrors.phone = "Phone number must be at least 10 digits";
//     }

//     // Address validation (required)
//     if (!formData.address.trim()) {
//       newErrors.address = "Address is required";
//     }

//     // Password validation (optional, but if provided must be 6+ chars)
//     if (formData.newPassword && formData.newPassword.length < 6) {
//       newErrors.newPassword = "Password must be at least 6 characters";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) {
//       return;
//     }

//     try {
//       setSubmitting(true);
//       setError(null);

//       // Prepare data - only include password if provided
//       const userData = { ...formData };
//       if (!userData.newPassword) {
//         delete userData.newPassword;
//       }

//       await userService.updateUser(id, userData);

//       // Navigate to user details on success
//       navigate(`/users/${id}`);
//     } catch (err) {
//       if (err.response?.data?.errors) {
//         // Handle Zod validation errors
//         const fieldErrors = {};
//         err.response.data.errors.forEach((error) => {
//           const path = error.path.join(".");
//           fieldErrors[path] = error.message;
//         });
//         setErrors(fieldErrors);
//       } else {
//         setError(err.response?.data?.message || "Failed to update user");
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Get role icon
//   const getRoleIcon = (role) => {
//     switch (role) {
//       case "superadmin":
//         return <ShieldCheck className="w-5 h-5" />;
//       case "admin":
//         return <Shield className="w-5 h-5" />;
//       case "manager":
//         return <ClipboardList className="w-5 h-5" />;
//       case "staff":
//         return <Wrench className="w-5 h-5" />;
//       default:
//         return <UserCog className="w-5 h-5" />;
//     }
//   };

//   // Loading state
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-gray-500">Loading user data...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 p-4">
//       {/* Page Header */}
//       <div className="flex items-center gap-4"></div>

//       {/* Error Message */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
//           {error}
//         </div>
//       )}

//       {/* Form */}
//       <form onSubmit={handleSubmit}>
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Basic Information */}
//           <Card className="shadow-sm lg:col-span-3">
//             <CardHeader>
//               <CardTitle className="text-lg">Basic Information</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               {/* Name (Required) */}
//               <div className="space-y-2">
//                 <Label htmlFor="name">
//                   Full Name <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="name"
//                   name="name"
//                   type="text"
//                   value={formData.name}
//                   onChange={handleChange}
//                   placeholder="Enter full name"
//                   className={errors.name ? "border-red-500" : ""}
//                 />
//                 {errors.name && (
//                   <p className="text-sm text-red-600">{errors.name}</p>
//                 )}
//               </div>

//               {/* Email */}
//               <div className="space-y-2">
//                 <Label htmlFor="email">
//                   Email Address <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="email"
//                   name="email"
//                   type="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   placeholder="Enter email address"
//                   className={errors.email ? "border-red-500" : ""}
//                 />
//                 {errors.email && (
//                   <p className="text-sm text-red-600">{errors.email}</p>
//                 )}
//               </div>

//               {/* Phone */}
//               <div className="space-y-2">
//                 <Label htmlFor="phone">
//                   Phone Number <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="phone"
//                   name="phone"
//                   type="tel"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   placeholder="Enter phone number"
//                   className={errors.phone ? "border-red-500" : ""}
//                 />
//                 {errors.phone && (
//                   <p className="text-sm text-red-600">{errors.phone}</p>
//                 )}
//               </div>

//               {/* Address */}
//               <div className="space-y-2">
//                 <Label htmlFor="address">
//                   Address <span className="text-red-500">*</span>
//                 </Label>
//                 <Input
//                   id="address"
//                   name="address"
//                   type="text"
//                   value={formData.address}
//                   onChange={handleChange}
//                   placeholder="Enter address"
//                   className={errors.address ? "border-red-500" : ""}
//                 />
//                 {errors.address && (
//                   <p className="text-sm text-red-600">{errors.address}</p>
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Password */}
//           <Card className="shadow-sm lg:col-span-3">
//             <CardHeader>
//               <CardTitle className="text-lg">
//                 Change Password (Optional)
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-2">
//                 <Label htmlFor="newPassword">New Password</Label>
//                 <Input
//                   id="newPassword"
//                   name="newPassword"
//                   type="password"
//                   value={formData.newPassword}
//                   onChange={handleChange}
//                   placeholder="Enter new password"
//                   className={errors.newPassword ? "border-red-500" : ""}
//                   style={{ maxWidth: "400px" }}
//                 />
//                 {errors.newPassword && (
//                   <p className="text-sm text-red-600">{errors.newPassword}</p>
//                 )}
//                 <p className="text-sm text-gray-500">
//                   Leave blank to keep the current password unchanged.
//                 </p>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Submit Button */}
//         <div className="flex justify-end gap-3 mt-6">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => navigate(`/users/${id}`)}
//           >
//             Cancel
//           </Button>
//           <Button type="submit" disabled={submitting} className="gap-2">
//             {submitting ? (
//               "Saving..."
//             ) : (
//               <>
//                 <Save className="w-4 h-4" />
//                 Save Changes
//               </>
//             )}
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default UserEdit;
