"use client";

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
} from "lucide-react";

const stats = [
  { label: "Total Rooms", value: "24", icon: DoorOpen, color: "text-blue-400", bg: "bg-blue-400/10" },
  { label: "Active Bookings", value: "8", icon: Calendar, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { label: "Pending Requests", value: "3", icon: Clock, color: "text-orange-400", bg: "bg-orange-400/10" },
  { label: "Completed Today", value: "12", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
];

const recentBookings = [
  { room: "Lecture Hall A", user: "Dr. Ahmed Hassan", time: "09:00 – 11:00", status: "confirmed", type: "Lecture Room" },
  { room: "Multi-Purpose Room 3", user: "Dr. Sara Mahmoud", time: "11:30 – 13:00", status: "pending", type: "Multi-Purpose" },
  { room: "Lecture Hall C", user: "Dr. Omar Khalil", time: "14:00 – 16:00", status: "confirmed", type: "Lecture Room" },
  { room: "Conference Room 2", user: "Sec. Nora Adel", time: "16:00 – 17:00", status: "pending", type: "Multi-Purpose" },
];

const statusColors: Record<string, string> = {
  confirmed: "bg-green-500/20 text-green-300 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function DashboardPage() {
  const router = useRouter();

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
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={Calendar} label="Bookings" />
          <NavItem icon={DoorOpen} label="Rooms" />
          <NavItem icon={Users} label="Staff" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={() => router.push("/")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blue-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-auto">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[hsl(215,60%,15%)] px-6 md:bg-transparent">
          <div>
            <h1 className="text-lg font-semibold text-white">Dashboard</h1>
            <p className="text-xs text-blue-300">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-blue-300">Room Manager</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(45,100%,50%)] text-sm font-bold text-[hsl(215,60%,20%)]">
              A
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-8">
          {/* Welcome banner */}
          <div className="rounded-2xl bg-gradient-to-r from-[hsl(215,60%,20%)] to-[hsl(215,50%,30%)] border border-white/10 p-6">
            <h2 className="text-2xl font-bold text-white">Welcome back! 👋</h2>
            <p className="mt-1 text-blue-200">Here&apos;s an overview of today&apos;s room activity at AASTMT.</p>
            <Button
              className="mt-4 bg-[hsl(45,100%,50%)] text-[hsl(215,60%,20%)] font-semibold hover:bg-[hsl(45,100%,45%)]"
              size="sm"
            >
              + New Booking
            </Button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:bg-white/10"
              >
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-blue-300">{s.label}</p>
              </div>
            ))}
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
                    <th className="px-4 py-3 text-left font-medium text-blue-300 hidden sm:table-cell">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-blue-300 hidden md:table-cell">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-blue-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/5 transition hover:bg-white/5 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-white">{b.room}</td>
                      <td className="px-4 py-3 text-blue-200">{b.user}</td>
                      <td className="px-4 py-3 text-blue-200 hidden sm:table-cell">{b.time}</td>
                      <td className="px-4 py-3 text-blue-200 hidden md:table-cell">{b.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[b.status]}`}
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
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <button
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
