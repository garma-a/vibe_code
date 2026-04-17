"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LogOut, Building2, Clock, CheckCircle2, XCircle, Inbox, Laptop, Mic, Video, User, CalendarDays, AlertTriangle } from "lucide-react";
import { logout } from "@/features/auth/actions";
import type { ManagerBookingRow } from "@/features/manager-dashboard/queries";

interface ManagerDashboardPageProps {
  managerName: string;
  stats: { awaitingAction: number; approved: number; rejected: number; total: number };
  pendingApprovals: ManagerBookingRow[];
  allBookings: ManagerBookingRow[];
  approveAction: (id: string) => Promise<{ success: boolean }>;
  rejectAction: (id: string, feedback: string) => Promise<{ success: boolean }>;
}

type Tab = "pending" | "history";

const STATUS_CHIP: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_CHIP[status] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-3xl font-bold text-[#0C2340]">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function ManagerDashboardPage({
  managerName,
  stats,
  pendingApprovals,
  allBookings,
  approveAction,
  rejectAction,
}: ManagerDashboardPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [selectedBooking, setSelectedBooking] = useState<ManagerBookingRow | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async () => {
    if (!selectedBooking) return;
    setIsProcessing(true);
    const result = await approveAction(selectedBooking.id);
    setIsProcessing(false);
    setSelectedBooking(null);
    if (result.success) showToast("Booking approved successfully.", "success");
    else showToast("Failed to approve. Please try again.", "error");
  };

  const handleReject = async () => {
    if (!selectedBooking || !feedback.trim()) return;
    setIsProcessing(true);
    const result = await rejectAction(selectedBooking.id, feedback);
    setIsProcessing(false);
    setSelectedBooking(null);
    setFeedback("");
    if (result.success) showToast("Booking rejected with feedback.", "success");
    else showToast("Failed to reject. Please try again.", "error");
  };

  const displayList = activeTab === "pending" ? pendingApprovals : allBookings;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-xl text-white text-sm font-medium transition-all ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-[#0C2340] text-white px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Building2 className="text-[#F1C400] w-6 h-6" />
          <div>
            <h1 className="font-bold text-lg leading-tight">Branch Manager Portal</h1>
            <p className="text-xs text-slate-300">AASTMT Room Management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{managerName}</p>
            <p className="text-xs text-[#F1C400] font-semibold">Branch Manager</p>
          </div>
          <form action={logout}>
            <Button variant="ghost" className="text-white hover:text-red-400 hover:bg-white/10 border border-white/20" type="submit">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Awaiting Your Action" value={stats.awaitingAction} icon={AlertTriangle} color="bg-amber-100 text-amber-600" />
          <StatCard label="You Approved" value={stats.approved} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" />
          <StatCard label="You Rejected" value={stats.rejected} icon={XCircle} color="bg-red-100 text-red-600" />
          <StatCard label="Total Multi-Purpose" value={stats.total} icon={CalendarDays} color="bg-[#0C2340]/10 text-[#0C2340]" />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200">
            {([
              { key: "pending", label: "Pending Approvals", icon: Clock, badge: stats.awaitingAction },
              { key: "history", label: "All Bookings", icon: Inbox },
            ] as const).map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors relative ${
                  activeTab === key
                    ? "text-[#0C2340] border-b-2 border-[#F1C400] bg-amber-50/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {badge != null && badge > 0 && (
                  <span className="ml-1 bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Booking List */}
          <div className="divide-y divide-slate-100">
            {displayList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Inbox className="w-10 h-10 mb-3 text-slate-300" />
                <p className="font-medium">
                  {activeTab === "pending" ? "No bookings awaiting your approval." : "No multi-purpose bookings found."}
                </p>
              </div>
            ) : (
              displayList.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => { setSelectedBooking(booking); setFeedback(""); }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  {/* Left: requester info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm">
                        {booking.profiles?.full_name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-slate-400">({booking.profiles?.employee_id})</span>
                      <StatusBadge status={booking.branch_manager_status ?? booking.status} />
                    </div>
                    <p className="text-sm text-slate-500 mt-1 truncate">{booking.reason}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {booking.date}</span>
                      <span>{booking.time_slots?.slot_name}</span>
                      <span className="font-medium text-slate-500">{booking.rooms?.name ?? "Room TBD"}</span>
                    </div>
                  </div>

                  {/* Right: tech requirements summary */}
                  <div className="hidden md:flex items-center gap-3 text-slate-400 text-xs">
                    {booking.has_laptop && <Laptop className="w-4 h-4" title="Laptop required" />}
                    {(booking.mics_count ?? 0) > 0 && <Mic className="w-4 h-4" title={`${booking.mics_count} mics`} />}
                    {booking.has_video_conf && <Video className="w-4 h-4" title="Video conferencing" />}
                  </div>

                  <Button variant="ghost" size="sm" className="text-[#0C2340] group-hover:bg-[#0C2340] group-hover:text-white transition-colors">
                    Review
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Review Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(o) => !o && setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0C2340]">
              <Building2 className="w-5 h-5 text-[#F1C400]" />
              Multi-Purpose Room Request
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-2 text-sm text-slate-700">
              {/* Requester */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-100">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-400">Requester Details</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-medium">{selectedBooking.profiles?.full_name}</span>
                  <span className="text-slate-500">Employee ID:</span>
                  <span className="font-medium">{selectedBooking.profiles?.employee_id}</span>
                </div>
              </div>

              {/* Booking Info */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-100">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-400">Booking Details</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-medium">{selectedBooking.date}</span>
                  <span className="text-slate-500">Time:</span>
                  <span className="font-medium">{selectedBooking.time_slots?.slot_name}</span>
                  <span className="text-slate-500">Room:</span>
                  <span className="font-medium">{selectedBooking.rooms?.name ?? "TBD"}</span>
                  <span className="text-slate-500">Purpose:</span>
                  <span className="font-medium col-span-1">{selectedBooking.reason}</span>
                </div>
              </div>

              {/* Multi-Purpose Form */}
              <div className="bg-amber-50 rounded-lg p-4 space-y-2 border border-amber-100">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-amber-600">Technical Requirements</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-slate-500">Responsible Manager:</span>
                  <span className="font-medium">{selectedBooking.manager_name}</span>
                  <span className="text-slate-500">Title:</span>
                  <span className="font-medium">{selectedBooking.manager_job_title}</span>
                  <span className="text-slate-500">Mobile:</span>
                  <span className="font-medium">{selectedBooking.manager_mobile}</span>
                  <span className="text-slate-500">Microphones:</span>
                  <span className="font-medium">{selectedBooking.mics_count ?? 0}</span>
                  <span className="text-slate-500">Laptop:</span>
                  <span className="font-medium">{selectedBooking.has_laptop ? "Yes" : "No"}</span>
                  <span className="text-slate-500">Video Conf.:</span>
                  <span className="font-medium">{selectedBooking.has_video_conf ? "Yes" : "No"}</span>
                </div>
              </div>

              {/* Current Status */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Admin Status:</span>
                <StatusBadge status={selectedBooking.status} />
              </div>

              {/* Rejection Feedback */}
              {selectedBooking.branch_manager_status === "pending" && (
                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-600">Rejection Feedback (required if rejecting):</label>
                  <textarea
                    className="w-full text-sm p-2.5 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0C2340]"
                    rows={2}
                    placeholder="State your reason for rejection..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
              )}

              {/* Already decided */}
              {selectedBooking.branch_manager_status !== "pending" && (
                <div className={`rounded-lg p-3 text-sm border ${selectedBooking.branch_manager_status === "approved" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"}`}>
                  <strong>Your Decision:</strong> {selectedBooking.branch_manager_status === "approved" ? "Approved" : `Rejected — "${selectedBooking.branch_manager_feedback}"`}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedBooking(null)}>Close</Button>
            {selectedBooking?.branch_manager_status === "pending" && (
              <>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={handleReject}
                  disabled={!feedback.trim() || isProcessing}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button
                  className="bg-[#0C2340] hover:bg-[#0a1d35] text-white"
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
