import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createOrganizationSchema } from "@repo/validators";
import { ArrowLeft, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import organizationService from "@/api/organizationService";
import toast from "react-hot-toast";

const createOrgFormSchema = z
  .object({
    ...createOrganizationSchema.shape,
    admin: createOrganizationSchema.shape.admin.extend({
      confirmPassword: z.string().min(1, "Please confirm password"),
    }),
  })
  .refine((data) => data.admin.password === data.admin.confirmPassword, {
    message: "Passwords do not match",
    path: ["admin", "confirmPassword"],
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

const OrganizationCreate = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createOrgFormSchema),
  });

  const handleGenerate = () => {
    const pwd = generatePassword();
    setValue("admin.password", pwd);
    setValue("admin.confirmPassword", pwd);
    setShowPassword(true);
  };

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...adminData } = data.admin;
      await organizationService.createOrganization({
        ...data,
        admin: adminData,
      });
      toast.success("Organization created successfully");
      navigate("/app/organizations");
    } catch (err) {
      const errorData = err.response?.data;
      if (
        errorData?.errors &&
        Array.isArray(errorData.errors) &&
        errorData.errors.length > 0
      ) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || "Failed to create organization");
      }
    }
  };

  return (
    <div className="space-y-4 p-4 pb-20 md:pb-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/organizations")}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Organizations
        </Button>
        <h1 className="text-base font-semibold text-foreground">
          Create Organization
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4">
          {/* Organization Details */}
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">
                    Organization Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("name")}
                    placeholder="Enter organization name"
                    className={`mt-1 h-8 text-sm ${errors.name ? "border-red-500" : ""}`}
                  />
                  <FieldError message={errors.name?.message} />
                </div>
                <div>
                  <Label className="text-xs">Contact Email</Label>
                  <Input
                    {...register("contactEmail")}
                    type="email"
                    placeholder="Optional"
                    className={`mt-1 h-8 text-sm ${errors.contactEmail ? "border-red-500" : ""}`}
                  />
                  <FieldError message={errors.contactEmail?.message} />
                </div>
                <div>
                  <Label className="text-xs">Contact Phone</Label>
                  <Input
                    {...register("contactPhone")}
                    type="tel"
                    placeholder="Optional"
                    className={`mt-1 h-8 text-sm ${errors.contactPhone ? "border-red-500" : ""}`}
                  />
                  <FieldError message={errors.contactPhone?.message} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Details */}
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Admin Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">
                    Admin Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("admin.name")}
                    placeholder="Enter admin's full name"
                    className={`mt-1 h-8 text-sm ${errors.admin?.name ? "border-red-500" : ""}`}
                  />
                  <FieldError message={errors.admin?.name?.message} />
                </div>
                <div>
                  <Label className="text-xs">
                    Admin Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("admin.email")}
                    type="email"
                    placeholder="Enter admin's email"
                    className={`mt-1 h-8 text-sm ${errors.admin?.email ? "border-red-500" : ""}`}
                  />
                  <FieldError message={errors.admin?.email?.message} />
                </div>
                <div>
                  <Label className="text-xs">
                    Admin Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("admin.phone")}
                    type="tel"
                    placeholder="Enter admin's phone"
                    className={`mt-1 h-8 text-sm ${errors.admin?.phone ? "border-red-500" : ""}`}
                  />
                  <FieldError message={errors.admin?.phone?.message} />
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
                      {...register("admin.address.street")}
                      placeholder="Street address"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Input
                    {...register("admin.address.city")}
                    placeholder="City"
                    className="h-8 text-sm"
                  />
                  <Input
                    {...register("admin.address.state")}
                    placeholder="State"
                    className="h-8 text-sm"
                  />
                  <Input
                    {...register("admin.address.postalCode")}
                    placeholder="Postal code"
                    className="h-8 text-sm"
                  />
                  <Input
                    {...register("admin.address.country")}
                    placeholder="Country"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Admin Password
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
                      {...register("admin.password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      className={`h-8 text-sm pr-9 ${errors.admin?.password ? "border-red-500" : ""}`}
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
                  <FieldError message={errors.admin?.password?.message} />
                </div>
                <div>
                  <Label className="text-xs">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      {...register("admin.confirmPassword")}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm password"
                      className={`h-8 text-sm pr-9 ${errors.admin?.confirmPassword ? "border-red-500" : ""}`}
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
                  <FieldError
                    message={errors.admin?.confirmPassword?.message}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/app/organizations")}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Organization"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationCreate;
