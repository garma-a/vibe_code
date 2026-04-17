"use client";

import { CheckCircle, Clock, XCircle } from "lucide-react";

interface StatsProps {
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export function DashboardStats({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Pending Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
        <div className="md:w-14 w-12 md:h-14 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Clock className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Pending Requests</p>
          <p className="text-3xl font-bold text-slate-800">{stats.pending}</p>
        </div>
      </div>

      {/* Approved Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
        <div className="md:w-14 w-12 md:h-14 h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Approved Bookings</p>
          <p className="text-3xl font-bold text-slate-800">{stats.approved}</p>
        </div>
      </div>

      {/* Rejected Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
        <div className="md:w-14 w-12 md:h-14 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
          <XCircle className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Rejected Requests</p>
          <p className="text-3xl font-bold text-slate-800">{stats.rejected}</p>
        </div>
      </div>
    </div>
  );
}
