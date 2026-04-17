"use client";

import { type ElementType, useMemo, useState } from "react";
import { Building2, CalendarDays, CheckCircle2, Clock4, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";
import type {
  ManagerPendingApproval,
  ManagerRoom,
  ManagerSystemBooking,
  ManagerTimeSlot,
} from "@/features/manager-dashboard/queries";
import { ApprovalQueue } from "./approval-queue";
import { ReadOnlyCalendar } from "./read-only-calendar";

type ActiveTab = "queue" | "calendar";
type ToastType = "success" | "error" | "info";

type ApproveResult =
  | { success: true; warning?: string }
  | { success: false; error: string; code?: string };

interface ManagerDashboardPageProps {
  managerName: string;
  pendingApprovals: ManagerPendingApproval[];
  rooms: ManagerRoom[];
  timeSlots: ManagerTimeSlot[];
  fetchSystemBookingsAction: (
    startDate: string,
    endDate: string,
  ) => Promise<ManagerSystemBooking[]>;
  approveAction: (id: string) => Promise<ApproveResult>;
}

export function ManagerDashboardPage({
  managerName,
  pendingApprovals,
  rooms,
  timeSlots,
  fetchSystemBookingsAction,
  approveAction,
}: ManagerDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("queue");
  const [queueItems, setQueueItems] = useState<ManagerPendingApproval[]>(pendingApprovals);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast((current) => {
        if (current?.message !== message) return current;
        return null;
      });
    }, 3500);
  };

  const stats = useMemo(() => {
    const pending = queueItems.length;
    const totalRooms = rooms.length;
    const totalSlots = timeSlots.length;
    return { pending, totalRooms, totalSlots };
  }, [queueItems.length, rooms.length, timeSlots.length]);

  return (
    <div className="min-h-screen bg-slate-50">
      {toast ? (
        <div
          className={`fixed right-4 top-4 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-600"
              : toast.type === "error"
                ? "bg-red-600"
                : "bg-[#0C2340]"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <header className="sticky top-0 z-30 border-b border-[#0C2340]/20 bg-[#0C2340] text-white shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/10 p-2">
              <Building2 className="h-5 w-5 text-[#F1C400]" />
            </div>
            <div>
              <h1 className="text-base font-bold md:text-lg">Branch Manager Dashboard</h1>
              <p className="text-xs text-blue-200">Final approval for multi-purpose requests</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold">{managerName}</p>
              <p className="text-xs text-[#F1C400]">Branch Manager</p>
            </div>
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                className="border border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Pending Final Approvals"
            value={String(stats.pending)}
            icon={Clock4}
            tone="amber"
          />
          <StatCard
            label="Active Rooms Visible"
            value={String(stats.totalRooms)}
            icon={Building2}
            tone="blue"
          />
          <StatCard
            label="Active Time Slots"
            value={String(stats.totalSlots)}
            icon={CalendarDays}
            tone="emerald"
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <TabButton
              label="Pending Queue"
              active={activeTab === "queue"}
              onClick={() => setActiveTab("queue")}
              badge={queueItems.length}
            />
            <TabButton
              label="System Calendar (Read Only)"
              active={activeTab === "calendar"}
              onClick={() => setActiveTab("calendar")}
            />
          </div>
        </section>

        {activeTab === "queue" ? (
          <ApprovalQueue
            items={queueItems}
            approveAction={approveAction}
            onApproved={(id) => {
              setQueueItems((current) => current.filter((item) => item.id !== id));
            }}
            onToast={showToast}
          />
        ) : (
          <ReadOnlyCalendar
            rooms={rooms}
            timeSlots={timeSlots}
            fetchSystemBookingsAction={fetchSystemBookingsAction}
            onToast={showToast}
          />
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p>
              Manager permissions on this screen are intentionally limited to final-approve workflow and
              read-only visibility. No edit or rejection controls are exposed.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ElementType;
  tone: "amber" | "blue" | "emerald";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "blue"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg border p-2 ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0C2340]">{value}</p>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-[#0C2340] text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span>{label}</span>
      {badge && badge > 0 ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F1C400] px-1 text-xs font-bold text-[#0C2340]">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
