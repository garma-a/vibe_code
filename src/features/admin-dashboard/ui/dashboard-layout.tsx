"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Building2,
  CalendarDays,
  Search,
  Users,
  Settings,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { useTransition } from "react";
import { logout } from "@/features/auth/actions";

const navigation = [
  { name: 'Approvals & Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Calendar Grid', href: '/admin/calendar', icon: CalendarDays, exact: false },
  { name: 'Find Empty Rooms', href: '/admin/search', icon: Search, exact: false },
  { name: 'User Management', href: '/admin/users', icon: Users, exact: false },
  { name: 'System Settings', href: '/admin/settings', icon: Settings, exact: false },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const currentPage = navigation.find(n => isActive(n.href, n.exact))?.name ?? "Admin";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar - fixed on the left, does NOT scroll */}
      <aside className="w-64 shrink-0 bg-[#0C2340] text-blue-100 flex flex-col shadow-2xl z-20">
        {/* Logo */}
        <div className="p-6 border-b border-blue-900/50">
          <div className="flex items-center gap-3 text-white mb-1">
            <Building2 className="text-[#F1C400] h-7 w-7 shrink-0" />
            <h1 className="font-bold tracking-tight text-xl">AASTMT</h1>
          </div>
          <p className="text-xs text-blue-300 font-medium tracking-wider uppercase">Room Manager Admin</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-5 px-3 space-y-0.5">
          {navigation.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 ${
                  active
                    ? "bg-[#F1C400] text-[#0C2340] shadow-sm"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-[#0C2340]" : "text-blue-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-blue-900/50">
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={isPending}
            className="w-full flex items-center justify-start gap-3 px-3 text-blue-300 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {isPending ? "Signing out…" : "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* Right side: top bar + scrollable content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center px-8 justify-between shadow-sm z-10">
          <p className="text-sm font-semibold text-slate-600">{currentPage}</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:block">Admin Session</span>
            <div className="h-8 w-8 rounded-full bg-[#0C2340] flex items-center justify-center text-white font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

