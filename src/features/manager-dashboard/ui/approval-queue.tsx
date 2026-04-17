"use client";

import { type ElementType, useMemo, useState } from "react";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Laptop,
  MessageSquare,
  Mic,
  Phone,
  User,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ManagerPendingApproval } from "@/features/manager-dashboard/queries";

type QueueToastType = "success" | "error" | "info";

type ApproveResult =
  | { success: true; warning?: string }
  | { success: false; error: string; code?: string };

interface ApprovalQueueProps {
  items: ManagerPendingApproval[];
  approveAction: (id: string) => Promise<ApproveResult>;
  onApproved: (id: string) => void;
  onToast: (message: string, type: QueueToastType) => void;
}

export function ApprovalQueue({
  items,
  approveAction,
  onApproved,
  onToast,
}: ApprovalQueueProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedBooking = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const handleFinalApprove = async () => {
    if (!selectedBooking) return;

    setIsProcessing(true);
    const result = await approveAction(selectedBooking.id);
    setIsProcessing(false);

    if (!result.success) {
      onToast(result.error, "error");
      return;
    }

    onApproved(selectedBooking.id);
    setSelectedId(null);

    if (result.warning) {
      onToast(result.warning, "info");
      return;
    }

    onToast("Final approval submitted successfully.", "success");
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-[#0C2340]">Pending Final Approvals</h2>
        <p className="mt-1 text-sm text-slate-500">
          This queue only includes multi-purpose requests already approved by Admin.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="mt-3 text-base font-semibold text-slate-800">No pending approvals.</p>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              All Admin-approved multi-purpose requests have been processed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((booking) => (
              <div key={booking.id} className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      Pending Final Approval
                    </span>
                    <span className="text-xs text-slate-400">Request ID: {booking.id}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {booking.profiles?.full_name ?? "Unknown Requester"}
                    </span>
                    <span>{booking.rooms?.name ?? "Room TBA"}</span>
                    <span>{booking.time_slots?.slot_name ?? "Time slot TBA"}</span>
                    <span>{booking.date}</span>
                  </div>

                  <p className="mt-2 truncate text-sm text-slate-500">{booking.reason}</p>
                </div>

                <div className="flex justify-end md:block">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#0C2340]/20 text-[#0C2340] hover:bg-[#0C2340] hover:text-white"
                    onClick={() => setSelectedId(booking.id)}
                  >
                    Review Request
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0C2340]">Multi-Purpose Request Review</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 text-sm text-slate-700">
              <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <InfoLine icon={User} label="Requester" value={selectedBooking.profiles?.full_name ?? "Unknown"} />
                <InfoLine icon={Briefcase} label="Employee ID" value={selectedBooking.profiles?.employee_id ?? "N/A"} />
                <InfoLine icon={CalendarDays} label="Date" value={selectedBooking.date} />
                <InfoLine
                  icon={CalendarDays}
                  label="Time"
                  value={selectedBooking.time_slots?.slot_name ?? "N/A"}
                />
                <InfoLine icon={Briefcase} label="Room" value={selectedBooking.rooms?.name ?? "TBA"} />
                <InfoLine icon={MessageSquare} label="Purpose" value={selectedBooking.reason} />
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Event Manager and Technical Requirements
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <InfoLine icon={User} label="Manager Name" value={selectedBooking.manager_name ?? "N/A"} />
                  <InfoLine
                    icon={Briefcase}
                    label="Job Title"
                    value={selectedBooking.manager_job_title ?? "N/A"}
                  />
                  <InfoLine icon={Phone} label="Mobile" value={selectedBooking.manager_mobile ?? "N/A"} />
                  <InfoLine icon={Mic} label="Microphones" value={String(selectedBooking.mics_count ?? 0)} />
                  <InfoLine icon={Laptop} label="Laptop" value={selectedBooking.has_laptop ? "Yes" : "No"} />
                  <InfoLine icon={Video} label="Video Conference" value={selectedBooking.has_video_conf ? "Yes" : "No"} />
                </div>
              </div>

              {selectedBooking.admin_feedback && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin Note</p>
                  <p className="mt-1 text-sm text-slate-700">{selectedBooking.admin_feedback}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setSelectedId(null)}>
              Close
            </Button>
            <Button
              type="button"
              className="bg-[#0C2340] text-white hover:bg-[#0a1d35]"
              onClick={handleFinalApprove}
              disabled={isProcessing || !selectedBooking}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {isProcessing ? "Approving..." : "Final Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="flex items-center gap-2 truncate text-sm font-medium text-slate-800">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}
