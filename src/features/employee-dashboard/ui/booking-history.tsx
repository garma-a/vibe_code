"use client";

import { BookingRow } from "@/features/bookings/queries";
import { format } from "date-fns"; // We don't have date-fns, let's use standard JS dates or just native format
import { AlertCircle, CalendarRange } from "lucide-react";

export function BookingHistory({ history }: { history: BookingRow[] }) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
          <CalendarRange className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">No requests yet</h3>
        <p className="text-slate-500 mt-1 max-w-sm">
          You haven't made any booking requests. Once you do, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-[#0C2340]">Recent Requests</h3>
        <p className="text-sm text-slate-500">History of your Room Booking attempts</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-sm font-medium text-slate-500 border-b border-slate-100">
              <th className="p-4 px-6 font-medium">Type</th>
              <th className="p-4 font-medium">Date & Time</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 px-6 font-medium text-right">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {history.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 px-6">
                  <div className="font-medium text-slate-800 capitalize">
                    {row.room_type.replace("-", " ")}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-slate-800 font-medium">
                    {new Date(row.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{row.time_slot}</div>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      row.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : row.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    <span className="capitalize">{row.status}</span>
                  </span>
                </td>
                <td className="p-4 px-6 text-right max-w-[200px] truncate">
                  {row.admin_feedback ? (
                    <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-md">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate" title={row.admin_feedback}>
                        {row.admin_feedback}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
