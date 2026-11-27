import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { loginSchema } from "@repo/validators";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import toast from "react-hot-toast";
import TestingNotice from "../website/TestingNotice";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const demoAccounts = [
  { role: "Admin", email: "admin@demo.com", password: "Admin@123" },
  { role: "Manager", email: "manager@demo.com", password: "demo1234" },
  { role: "Staff 1", email: "staff1@demo.com", password: "demo1234" },
  { role: "Staff 2", email: "staff2@demo.com", password: "demo1234" },
];

function Login() {
  useDocumentTitle('Login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const fillDemoCreds = (email, password) => {
    setValue("email", email);
    setValue("password", password);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate("/app");
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 py-12 px-4">
      <div className="w-full max-w-md space-y-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">MRM</CardTitle>
          <CardDescription>Mobile Repair Management</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {isDemoMode && (
              <div className="rounded-md border border-border bg-muted p-3 text-sm space-y-2">
                <p className="font-medium">Demo accounts (click to fill)</p>
                <div className="flex gap-2 flex-wrap">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => fillDemoCreds(acc.email, acc.password)}
                      className="px-2 py-1 text-xs rounded-md border border-border bg-background hover:bg-accent"
                    >
                      {acc.role}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <TestingNotice />
    </div>
    </div>
  );
}

export default Login;