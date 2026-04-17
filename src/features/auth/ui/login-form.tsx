"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, ShieldAlert, UserCog, Building2, User, Briefcase } from "lucide-react";
import Link from "next/link";
import { loginWithEmployeeId } from "../actions";

export function LoginForm() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuickFill = (userId: string) => {
    setEmployeeId(userId);
    setPassword("password123");
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!employeeId || !password) {
      setError("Please enter your Employee ID and password.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const result = await loginWithEmployeeId(formData);
    
    if (result?.error) {
      setError(result.error);
    }
    
    // In case the action returns early without redirecting (due to error)
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[hsl(215,60%,15%)] via-[hsl(215,60%,20%)] to-[hsl(215,50%,10%)] p-4">
      {/* Background decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[hsl(45,100%,50%)] opacity-5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[hsl(215,60%,50%)] opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mt-10">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(45,100%,50%)] shadow-lg">
            <ShieldAlert className="h-8 w-8 text-[hsl(215,60%,20%)]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">AASTMT</h1>
          <p className="mt-1 text-sm text-blue-200">Room & Lecture Hall Management System</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Staff Login</h2>
            <p className="mt-1 text-sm text-blue-200">Sign in with your Employee ID</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="employeeId" className="text-sm font-medium text-blue-100">
                Employee ID
              </Label>
              <Input
                id="employeeId"
                name="employeeId"
                type="text"
                placeholder="e.g. EMP-12345"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="border-white/20 bg-white/10 text-white placeholder:text-blue-300/50 focus-visible:border-[hsl(45,100%,50%)] focus-visible:ring-[hsl(45,100%,50%)]/30"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-blue-100">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-white/20 bg-white/10 pr-10 text-white placeholder:text-blue-300/50 focus-visible:border-[hsl(45,100%,50%)] focus-visible:ring-[hsl(45,100%,50%)]/30"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 transition hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[hsl(45,100%,50%)] font-semibold text-[hsl(215,60%,20%)] shadow-lg transition hover:bg-[hsl(45,100%,45%)] hover:shadow-[hsl(45,100%,50%)]/30 disabled:opacity-60"
              size="lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" /> Sign In
                </span>
              )}
            </Button>
          </form>

          {/* Quick Login Auto-fills */}
          <div className="mt-8 border-t border-white/20 pt-6">
            <p className="mb-4 text-center text-xs text-blue-200/70 font-medium tracking-wide uppercase">
              Quick Testing Roles
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => handleQuickFill('ADM001')}
                className="border-white/10 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white flex items-center justify-start gap-2 h-10"
              >
                <UserCog className="w-4 h-4 shrink-0 text-[hsl(45,100%,50%)]" />
                <span className="truncate">Admin</span>
              </Button>
              <Button 
                variant="outline" 
                type="button"
                onClick={() => handleQuickFill('MGR001')}
                className="border-white/10 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white flex items-center justify-start gap-2 h-10"
              >
                <Building2 className="w-4 h-4 shrink-0 text-[hsl(45,100%,50%)]" />
                <span className="truncate">Manager</span>
              </Button>
              <Button 
                variant="outline" 
                type="button"
                onClick={() => handleQuickFill('EMP001')}
                className="border-white/10 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white flex items-center justify-start gap-2 h-10"
              >
                <User className="w-4 h-4 shrink-0 text-[hsl(45,100%,50%)]" />
                <span className="truncate">Employee</span>
              </Button>
              <Button 
                variant="outline" 
                type="button"
                onClick={() => handleQuickFill('SEC001')}
                className="border-white/10 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white flex items-center justify-start gap-2 h-10"
              >
                <Briefcase className="w-4 h-4 shrink-0 text-[hsl(45,100%,50%)]" />
                <span className="truncate">Secretary</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Back link */}
        <p className="mt-8 pb-8 text-center text-sm text-blue-300">
          <Link href="/" className="transition hover:text-[hsl(45,100%,50%)] hover:underline">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
