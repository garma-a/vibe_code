"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  BookOpen,
  Search
} from "lucide-react";
import { logout } from "@/features/auth/actions";
import { CalendarGrid } from "./calendar-grid";
import { AdvancedSearch } from "./advanced-search";

const statusColors: Record<string, string> = {
  confirmed: "bg-green-500/20 text-green-300 border-green-500/30",
  approved: "bg-green-500/20 text-green-300 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
};

interface DashboardProps {
  stats: any[];
  recentBookings: any[];
  rooms: any[];
  timeSlots: any[];
  fetchCalendarBookings: (date: string) => Promise<any[]>;
  searchEmptyRooms: (date: string, timeSlotId: string, roomType: string) => Promise<any[]>;
  approveBookingAction: (id: string) => Promise<{ success: boolean }>;
  rejectBookingAction: (id: string, feedback: string) => Promise<{ success: boolean }>;
  forceAssignAction: (data: any) => Promise<{ success: boolean }>;
  adminName: string;
}

export function DashboardPage({
  stats,
  recentBookings,
  rooms,
  timeSlots,
  fetchCalendarBookings,
  searchEmptyRooms,
  approveBookingAction,
  rejectBookingAction,
  forceAssignAction,
  adminName
}: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar" | "search">("dashboard");

  return (
    <div className="flex min-h-screen bg-[hsl(215,60%,10%)] text-white">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-[hsl(215,60%,15%)] md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(45,100%,50%)]">
            <BookOpen className="h-4 w-4 text-[hsl(215,60%,20%)]" />
          </div>
          <span className="font-bold tracking-wide text-white">AASTMT</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
          <NavItem icon={Calendar} label="Calendar Grid" active={activeTab === "calendar"} onClick={() => setActiveTab("calendar")} />
          <NavItem icon={Search} label="Advanced Search" active={activeTab === "search"} onClick={() => setActiveTab("search")} />
          <div className="my-2 border-t border-white/10" />
          <NavItem icon={DoorOpen} label="Rooms" />
          <NavItem icon={Users} label="Staff" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        <div className="border-t border-white/10 p-4">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blue-300 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden max-h-screen">
        {/* Top bar */}
        <header className="flex flex-shrink-0 h-16 items-center justify-between border-b border-white/10 bg-[hsl(215,60%,15%)] px-6 md:bg-transparent">
          <div>
            <h1 className="text-lg font-semibold text-white capitalize">{activeTab.replace('-', ' ')}</h1>
            <p className="text-xs text-blue-300">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right flex flex-col justify-center">
              <p className="text-sm font-medium text-white">{adminName}</p>
              <p className="text-xs text-blue-300">Room Manager</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(45,100%,50%)] text-sm font-bold text-[hsl(215,60%,20%)] uppercase">
              {adminName.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Welcome banner */}
              <div className="rounded-2xl bg-gradient-to-r from-[hsl(215,60%,20%)] to-[hsl(215,50%,30%)] border border-white/10 p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Welcome back! 👋</h2>
                  <p className="mt-1 text-blue-200">Here&apos;s an overview of today&apos;s room activity at AASTMT.</p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {stats.map((s, idx) => {
                  // Fallback icons
                  const IconComponent = s.icon === "DoorOpen" ? DoorOpen : s.icon === "Calendar" ? Calendar : s.icon === "Clock" ? Clock : CheckCircle2;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:bg-white/10"
                    >
                      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                        <IconComponent className={`h-5 w-5 ${s.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-white">{s.value}</p>
                      <p className="text-sm text-blue-300">{s.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Recent bookings */}
              <div>
                <h3 className="mb-4 text-base font-semibold text-white">Recent Booking Requests</h3>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-4 py-3 text-left font-medium text-blue-300">Room</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-300">Requested By</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-300 hidden sm:table-cell">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-300 hidden sm:table-cell">Time</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-300 hidden md:table-cell">Type</th>
                        <th className="px-4 py-3 text-left font-medium text-blue-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-4 text-center text-slate-400">No requests found.</td></tr>
                      ) : recentBookings.map((b, i) => (
                        <tr
                          key={i}
                          className="border-b border-white/5 transition hover:bg-white/5 last:border-0"
                        >
                          <td className="px-4 py-3 font-medium text-white">{b.room}</td>
                          <td className="px-4 py-3 text-blue-200">{b.user}</td>
                          <td className="px-4 py-3 text-blue-200 hidden sm:table-cell">{b.date}</td>
                          <td className="px-4 py-3 text-blue-200 hidden sm:table-cell">{b.time}</td>
                          <td className="px-4 py-3 text-blue-200 hidden md:table-cell">{b.type}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[b.status] || statusColors.pending}`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="h-full bg-slate-50 text-slate-900 rounded-xl overflow-hidden p-2">
              <CalendarGrid 
                rooms={rooms}
                timeSlots={timeSlots}
                fetchBookingsAction={fetchCalendarBookings}
                approveAction={approveBookingAction}
                rejectAction={rejectBookingAction}
              />
            </div>
          )}

          {activeTab === "search" && (
            <div className="h-full bg-slate-50 text-slate-900 rounded-xl p-4 overflow-auto">
              <AdvancedSearch 
                timeSlots={timeSlots}
                searchAction={searchEmptyRooms}
                assignAction={forceAssignAction}
              />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false, onClick }: { icon: React.ElementType; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
        active
          ? "bg-[hsl(45,100%,50%)]/15 text-[hsl(45,100%,60%)] font-medium"
          : "text-blue-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
