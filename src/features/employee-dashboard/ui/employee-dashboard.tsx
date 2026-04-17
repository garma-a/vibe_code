"use client";

import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { logout } from "@/features/auth/actions";

export function EmployeeDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#0C2340] text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <User className="text-[#F1C400]" />
          <h1 className="font-bold text-xl">Faculty / Employee Dashboard</h1>
        </div>
        <form action={logout}>
          <Button variant="ghost" className="text-white hover:text-red-400 hover:bg-white/10" type="submit">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </form>
      </header>
      <main className="flex-1 p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 h-full flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome!</h2>
          <p className="text-slate-500 max-w-md">Use this portal to submit blind booking requests for lecture rooms and multi-purpose rooms.</p>
        </div>
      </main>
    </div>
  );
}
