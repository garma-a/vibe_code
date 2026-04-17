"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Clock, FileText, Loader2, User, Phone, Laptop, Mic2, Tv } from "lucide-react";
import { managerApproveBooking, managerRejectBooking } from "../actions";

type Booking = {
  id: string;
  date: string;
  reason: string;
  manager_name: string;
  manager_job_title: string;
  manager_mobile: string;
  mics_count: number;
  has_laptop: boolean;
  has_video_conf: boolean;
  rooms: { name: string } | null;
  profiles: { full_name: string; employee_id: string } | null;
};

interface Props {
  pendingRequests: Booking[];
}

export function ManagerDashboard({ pendingRequests }: Props) {
  const [requests, setRequests] = useState<Booking[]>(pendingRequests);
  const [isPending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await managerApproveBooking(id);
      if (!result.error) {
        setRequests(prev => prev.filter(r => r.id !== id));
      }
    });
  };

  const handleRejectSubmit = (id: string) => {
    if (!rejectReason.trim()) return;
    startTransition(async () => {
      const result = await managerRejectBooking(id, rejectReason);
      if (!result.error) {
        setRequests(prev => prev.filter(r => r.id !== id));
        setRejectingId(null);
        setRejectReason('');
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0C2340]">Branch Manager Portal</h2>
        <p className="text-muted-foreground mt-2">Final approval for Multi-Purpose room events and seminars.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Awaiting Decision</p>
                <p className="text-3xl font-bold text-slate-900">{requests.length}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Requests</CardTitle>
          <CardDescription>Review technical requirements and coordinator details for multi-purpose room bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-slate-200" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p className="text-sm">You've cleared all multi-purpose room requests.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map(req => (
                <div key={req.id} className="border rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col md:flex-row">
                  {/* Left Section: Main Info */}
                  <div className="p-6 flex-1 border-b md:border-b-0 md:border-r bg-slate-50/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-2 py-0 text-[10px] uppercase font-bold tracking-wider">Multi-Purpose</Badge>
                          <span className="text-xs text-slate-400 font-medium">📅 {req.date}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{req.rooms?.name || "Dynamic Room"}</h3>
                        <p className="text-slate-600 mt-2 font-medium italic">"{req.reason}"</p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coordinator</p>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold">{req.manager_name}</span>
                        </div>
                        <p className="text-xs text-slate-500 pl-6">{req.manager_job_title}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{req.manager_mobile}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Requirements</p>
                        <div className="flex flex-wrap gap-2">
                          {req.has_laptop && (
                            <Badge variant="outline" className="gap-1 px-2 py-1 text-[10px] border-slate-200 bg-white">
                              <Laptop className="w-3 h-3" /> Laptop
                            </Badge>
                          )}
                          {req.has_video_conf && (
                            <Badge variant="outline" className="gap-1 px-2 py-1 text-[10px] border-slate-200 bg-white">
                              <Tv className="w-3 h-3" /> Video Conf
                            </Badge>
                          )}
                          {req.mics_count > 0 && (
                            <Badge variant="outline" className="gap-1 px-2 py-1 text-[10px] border-slate-200 bg-white">
                              <Mic2 className="w-3 h-3" /> {req.mics_count} Mics
                            </Badge>
                          )}
                          {!req.has_laptop && !req.has_video_conf && req.mics_count === 0 && (
                            <span className="text-xs text-slate-400">Standard Room Setup</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Actions */}
                  <div className="p-6 w-full md:w-64 bg-white flex flex-col justify-center gap-3">
                    <div className="text-xs text-slate-400 mb-2 text-center">
                      Requested by: <span className="font-semibold text-slate-700">{req.profiles?.full_name}</span>
                    </div>
                    
                    {rejectingId === req.id ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Label className="text-[10px] uppercase font-bold text-red-600">Rejection Reason</Label>
                        <textarea 
                          className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-red-200 outline-none"
                          rows={3}
                          placeholder="Why is this being rejected?"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => handleRejectSubmit(req.id)}
                            disabled={isPending || !rejectReason.trim()}
                          >
                            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="flex-1 text-slate-500"
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button 
                          className="w-full bg-[#0C2340] hover:bg-[#0C2340]/90 text-white shadow-lg h-11"
                          onClick={() => handleApprove(req.id)}
                          disabled={isPending}
                        >
                          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                          Approve Request
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-11"
                          onClick={() => setRejectingId(req.id)}
                          disabled={isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Event
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
