"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, User, LayoutDashboard, PlusCircle } from "lucide-react";
import { logout } from "@/features/auth/actions";
import { DashboardStats } from "./dashboard-stats";
import { BookingHistory } from "./booking-history";
import { NewRequestForm } from "./new-request-form";
import { getEmployeeStats, getEmployeeHistory, BookingRow } from "@/features/bookings/queries";

export function EmployeeDashboard({ role = "employee" }: { role?: "employee" | "secretary" }) {
  const [activeTab, setActiveTab] = useState<"overview" | "new-request">("overview");
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [history, setHistory] = useState<BookingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [newStats, newHistory] = await Promise.all([
        getEmployeeStats(),
        getEmployeeHistory(),
      ]);
      setStats(newStats);
      setHistory(newHistory);

    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-[#0C2340] text-white px-6 py-4 flex justify-between items-center shadow-lg shadow-[#0C2340]/10 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10">
            <User className="text-[#F1C400] w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Faculty Portal</h1>
            <p className="text-xs text-slate-300 font-medium">Standard User Level</p>
          </div>
        </div>
        <form action={logout}>
          <Button variant="ghost" className="text-white hover:text-[#F1C400] hover:bg-white/10 rounded-xl" type="submit">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </form>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === "overview"
              ? "bg-slate-100 text-[#0C2340]"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("new-request")}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${activeTab === "new-request"
              ? "bg-[#0C2340] text-white shadow-md shadow-[#0C2340]/20"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
          >
            <PlusCircle className="w-4 h-4" />
            New Request
          </button>
        </div>

        <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {isLoading ? (
                <div className="h-64 flex items-center justify-center text-slate-400">Loading data...</div>
              ) : (
                <>
                  <DashboardStats stats={stats} />
                  <BookingHistory history={history} />
                </>
              )}
            </div>
          )}

          {activeTab === "new-request" && (
            <div className="max-w-2xl">
              <NewRequestForm
                role={role}
                onSuccess={() => {
                  setIsLoading(true);
                  void loadData(); // refresh
                  setActiveTab("overview"); // jump back to overview to see it pending
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
