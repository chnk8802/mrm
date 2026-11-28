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
import toast from "react-hot-toast";
import TestingNotice from "../website/TestingNotice";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import Logo from "@/components/common/Logo";
import whiteLogo from "@/assets/ohmic-white-logo.png";
import BetaNotice from "@/components/common/BetaNotice";

const demoAccounts = [
  { role: "Admin", email: "admin@demo.com", password: "Admin@123" },
  { role: "Manager", email: "manager@demo.com", password: "demo1234" },
  { role: "Staff 1", email: "staff1@demo.com", password: "demo1234" },
  { role: "Staff 2", email: "staff2@demo.com", password: "demo1234" },
];

// The ring from the logo's "O", used as a cropped background shape.
const RingMark = () => (
  <svg
    viewBox="0 0 400 400"
    aria-hidden="true"
    className="pointer-events-none absolute -bottom-40 -right-40 w-[560px]"
  >
    <circle
      cx="200"
      cy="200"
      r="150"
      fill="none"
      stroke="#fff"
      strokeOpacity="0.07"
      strokeWidth="44"
    />
    <circle
      className="ring-arc"
      cx="200"
      cy="200"
      r="150"
      fill="none"
      stroke="#a80000"
      strokeWidth="44"
      strokeDasharray="140 802.5"
      transform="rotate(-165 200 200)"
    />
  </svg>
);

function Login() {
  useDocumentTitle("Login");
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
    <div
      className="min-h-screen lg:grid lg:grid-cols-[5fr_6fr]"
      style={{
        "--primary": "0 0% 7%",
        "--primary-foreground": "0 0% 100%",
        "--ring": "0 100% 33%",
      }}
    >
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-[#0a0a0a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <img src={whiteLogo} alt="Ohmic" className="h-9 w-auto self-start" />

        <p className="relative z-10 max-w-xs text-lg leading-snug text-white/70">
          Repair management for mobile shops.
        </p>

        <RingMark />
      </aside>

      {/* Form panel */}
      <main className="relative flex min-h-screen flex-col bg-background">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#a80000]" />

        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">
            <div className="mb-10 lg:hidden">
              <Logo className="h-8 w-auto" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your account details to continue.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    {...register("password")}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
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

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            {isDemoMode && (
              <div className="mt-8 border-t border-border pt-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Demo accounts
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => fillDemoCreds(acc.email, acc.password)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-accent"
                    >
                      {acc.role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="absolute inset-x-0 top-0 h-1 bg-[#a80000]" />
            <div className="absolute right-5 top-6">
              <BetaNotice />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;