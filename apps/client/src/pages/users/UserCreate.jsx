import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { userSchema } from "@repo/validators";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  ClipboardList,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import userService from "@/api/userService";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

const createUserSchema = z
  .object({
    ...userSchema.shape,
    confirmPassword: z.string().min(1, "Please confirm password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const generatePassword = () => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  return Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-500 mt-1">{message}</p> : null;

const UserCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const roles = [
    {
      value: "admin",
      icon: Shield,
      description: "Manage repairs, customers, and daily operations",
    },
    {
      value: "manager",
      icon: ClipboardList,
      description: "Oversee workflows, staff tasks, and reports",
    },
    {
      value: "staff",
      icon: Wrench,
      description: "Handle assigned repairs and update job status",
    },
  ].filter((role) => user?.role === "superadmin" || role.value !== "admin");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "staff" },
  });

  const selectedRole = watch("role");

  const handleGenerate = () => {
    const pwd = generatePassword();
    setValue("password", pwd);
    setValue("confirmPassword", pwd);
    setShowPassword(true);
  };

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...userData } = data;
      await userService.createUser(userData);
      toast.success("User created successfully");
      navigate("/app/users");
    } catch (err) {
      const errorData = err.response?.data;

      if (
        errorData?.errors &&
        Array.isArray(errorData.errors) &&
        errorData.errors.length > 0
      ) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || "Failed to create user");
      }
    }
  };

  return (
    <div className="space-y-4 p-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/users")}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Users
        </Button>
        <h1 className="text-base font-semibold text-foreground">Create User</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Role Selection */}
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {roles.map(({ value, icon: Icon, description }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedRole === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    value={value}
                    {...register("role")}
                    className="mt-0.5 accent-primary"
                  />
                  <Icon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${selectedRole === value ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium capitalize ${selectedRole === value ? "text-primary" : "text-foreground"}`}
                    >
                      {value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {description}
                    </p>
                  </div>
                </label>
              ))}
              <FieldError message={errors.role?.message} />
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="border-border shadow-none lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("name")}
                    placeholder="Enter full name"
                    className={`mt-1 h-8 text-sm ${errors.name ? "border-red-500" : ""}`}
                  />
                  <FieldError message={errors.name?.message} />
                </div>
                <div>
                  <Label className="text-xs">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="Enter email"
                    className={`mt-1 h-8 text-sm ${errors.email ? "border-red-500" : ""}`}
                  />
                  <FieldError message={errors.email?.message} />
                </div>
                <div>
                  <Label className="text-xs">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("phone")}
                    type="tel"
                    placeholder="Enter phone number"
                    className={`mt-1 h-8 text-sm ${errors.phone ? "border-red-500" : ""}`}
                  />
                  <FieldError message={errors.phone?.message} />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Address
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div className="md:col-span-2">
                    <Input
                      {...register("address.street")}
                      placeholder="Street address"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Input
                    {...register("address.city")}
                    placeholder="City"
                    className="h-8 text-sm"
                  />
                  <Input
                    {...register("address.state")}
                    placeholder="State"
                    className="h-8 text-sm"
                  />
                  <Input
                    {...register("address.postalCode")}
                    placeholder="Postal code"
                    className="h-8 text-sm"
                  />
                  <Input
                    {...register("address.country")}
                    placeholder="Country"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card className="border-border shadow-none lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Password
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  className="h-7 text-xs gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Generate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      className={`h-8 text-sm pr-9 ${errors.password ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <FieldError message={errors.password?.message} />
                </div>
                <div>
                  <Label className="text-xs">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      {...register("confirmPassword")}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm password"
                      className={`h-8 text-sm pr-9 ${errors.confirmPassword ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <FieldError message={errors.confirmPassword?.message} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/app/users")}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserCreate;
