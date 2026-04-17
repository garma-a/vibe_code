"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, CalendarDays, LogIn } from "lucide-react";

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[hsl(215,60%,15%)] via-[hsl(215,60%,20%)] to-[hsl(215,50%,10%)] p-4 text-white">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 -left-60 h-[600px] w-[600px] rounded-full bg-[hsl(45,100%,50%)] opacity-5 blur-3xl" />
        <div className="absolute -bottom-60 -right-60 h-[700px] w-[700px] rounded-full bg-[hsl(215,60%,50%)] opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(45,100%,50%)] opacity-[0.03] blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Branding */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(45,100%,50%)] shadow-2xl shadow-[hsl(45,100%,50%)]/20 ring-4 ring-[hsl(45,100%,50%)]/20">
            <BookOpen className="h-10 w-10 text-[hsl(215,60%,20%)]" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            AASTMT
          </h1>
          <p className="mt-3 text-base text-blue-200 leading-relaxed">
            Room & Lecture Hall Management System
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <p className="mb-6 text-center text-sm text-blue-200">
            Streamline room bookings across all AASTMT facilities
          </p>

          <div className="space-y-4">
            <Button
              id="login-btn"
              className="w-full bg-[hsl(45,100%,50%)] font-semibold text-[hsl(215,60%,20%)] shadow-lg transition hover:bg-[hsl(45,100%,45%)] hover:shadow-[hsl(45,100%,50%)]/30"
              size="lg"
              onClick={() => router.push("/login")}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Login as Staff
            </Button>

            <Button
              id="schedule-btn"
              variant="outline"
              className="w-full border-white/20 bg-white/5 text-white hover:bg-white/15 hover:border-white/30"
              size="lg"
              onClick={() => router.push("/dashboard")}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              View Schedule
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-blue-400">
          © {new Date().getFullYear()} Arab Academy for Science, Technology & Maritime Transport
        </p>
      </div>
    </div>
  );
}
