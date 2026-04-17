"use client";

import { Button } from "@/components/ui/button";
import { LogOut, UserCog } from "lucide-react";
import { logout } from "@/features/auth/actions";

export function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#0C2340] text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <UserCog className="text-[#F1C400]" />
          <h1 className="font-bold text-xl">Admin Dashboard</h1>
        </div>
        <form action={logout}>
          <Button variant="ghost" className="text-white hover:text-red-400 hover:bg-white/10" type="submit">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </form>
      </header>
      <main className="flex-1 p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 h-full flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to the Admin Panel</h2>
          <p className="text-slate-500 max-w-md">This is where you will manage all schedules, view all empty rooms, and handle overriding rules as the "God Mode" manager.</p>
        </div>
      </main>
    </div>
  );
}
