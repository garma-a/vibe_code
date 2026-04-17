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
  ManagerVisibleRequest,
} from "@/features/manager-dashboard/queries";
import { ApprovalQueue } from "./approval-queue";
import { ReadOnlyCalendar } from "./read-only-calendar";

type ActiveTab = "queue" | "requests" | "calendar";
type ToastType = "success" | "error" | "info";

type ApproveResult =
  | { success: true; warning?: string }
  | { success: false; error: string; code?: string };

interface ManagerDashboardPageProps {
  managerName: string;
  pendingApprovals: ManagerPendingApproval[];
  allRequests: ManagerVisibleRequest[];
  rooms: ManagerRoom[];
  timeSlots: ManagerTimeSlot[];
  fetchSystemBookingsAction: (
    startDate: string,
    endDate: string,
  ) => Promise<ManagerSystemBooking[]>;
  approveAction: (id: string) => Promise<ApproveResult>;
  rejectAction: (id: string) => Promise<ApproveResult>;
}

export function ManagerDashboardPage({
  managerName,
  pendingApprovals,
  allRequests,
  rooms,
  timeSlots,
  fetchSystemBookingsAction,
  approveAction,
  rejectAction,
}: ManagerDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("queue");
  const [queueItems, setQueueItems] = useState<ManagerPendingApproval[]>(pendingApprovals);
  const [visibleRequests, setVisibleRequests] = useState<ManagerVisibleRequest[]>(allRequests);
  const [requestFilter, setRequestFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
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

  const filteredRequests = useMemo(() => {
    if (requestFilter === "all") return visibleRequests;
    return visibleRequests.filter((request) => request.status === requestFilter);
  }, [visibleRequests, requestFilter]);

  const stats = useMemo(() => {
    const pending = queueItems.length;
    const totalRooms = rooms.length;
    const totalSlots = timeSlots.length;
    const totalRequests = visibleRequests.length;
    return { pending, totalRooms, totalSlots, totalRequests };
  }, [queueItems.length, rooms.length, timeSlots.length, visibleRequests.length]);

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
          <StatCard
            label="Total Requests Visible"
            value={String(stats.totalRequests)}
            icon={CheckCircle2}
            tone="blue"
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
              label="All Requests (Read Only)"
              active={activeTab === "requests"}
              onClick={() => setActiveTab("requests")}
              badge={visibleRequests.length}
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
            rejectAction={rejectAction}
            onApproved={(id) => {
              setQueueItems((current) => current.filter((item) => item.id !== id));
              setVisibleRequests((current) =>
                current.map((request) =>
                  request.id === id
                    ? {
                        ...request,
                        branch_manager_status: "approved",
                      }
                    : request,
                ),
              );
            }}
            onRejected={(id) => {
              setQueueItems((current) => current.filter((item) => item.id !== id));
              setVisibleRequests((current) =>
                current.map((request) =>
                  request.id === id
                    ? {
                        ...request,
                        status: "rejected",
                        branch_manager_status: "rejected",
                      }
                    : request,
                ),
              );
            }}
            onToast={showToast}
          />
        ) : activeTab === "requests" ? (
          <section className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-[#0C2340]">All Requests (Read Only)</h2>
              <p className="mt-1 text-sm text-slate-500">
                Full visibility over all requests in the system. Actions are restricted to the Pending Queue.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(["all", "pending", "approved", "rejected"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setRequestFilter(filter)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      requestFilter === filter
                        ? "bg-[#0C2340] text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              {filteredRequests.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-slate-500">No requests found.</div>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Requester</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Slot</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Branch Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{request.profiles?.full_name ?? "Unknown"}</p>
                          <p className="text-xs text-slate-500">{request.profiles?.employee_id ?? "N/A"}</p>
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-700">
                          {(request.profiles?.role ?? "unknown").replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{request.rooms?.name ?? "Unknown Room"}</td>
                        <td className="px-4 py-3 text-slate-700">{request.date}</td>
                        <td className="px-4 py-3 text-slate-700">{request.time_slots?.slot_name ?? "N/A"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              request.status === "approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : request.status === "rejected"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {request.branch_manager_status ?? "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
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
              Branch Manager can see all system requests. Actions are restricted to approve/reject only for
              Admin-created multi-purpose requests in Pending Queue.
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
