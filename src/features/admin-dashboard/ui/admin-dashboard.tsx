"use client";

import { useTransition, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, FileText, Loader2, PlusCircle, X } from "lucide-react";
import { approveBooking, rejectBooking, bookMultiPurposeRoomAsAdmin } from "../actions";

type Booking = {
  id: string;
  room_type: string;
  date: string;
  reason: string;
  status: string;
  branch_manager_status?: string;
  branch_manager_feedback?: string;
  rooms: { name: string } | null;
  profiles: { full_name: string; employee_id: string } | null;
};

type Room = { id: string; name: string; type: string };
type Slot = { id: string; slot_name: string; start_time: string; end_time: string };

interface Props {
  initialRequests: Booking[];
  pendingCount: number;
  approvedCount: number;
  multiActiveCount: number;
  multiPurposeRooms: Room[];
  timeSlots: Slot[];
  multiPurposeStatusRequests?: Booking[];
}

export function AdminDashboard({ initialRequests, pendingCount, approvedCount, multiActiveCount, multiPurposeRooms, timeSlots, multiPurposeStatusRequests = [] }: Props) {
  const [requests, setRequests] = useState<Booking[]>(initialRequests);
  const [isPending, startTransition] = useTransition();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectAlt, setRejectAlt] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleApprove = (id: string) => {
    startTransition(async () => {
      await approveBooking(id);
      setRequests(prev => prev.filter(r => r.id !== id));
    });
  };

  const handleRejectSubmit = (id: string) => {
    if (!rejectReason.trim()) return;
    startTransition(async () => {
      await rejectBooking(id, rejectReason, rejectAlt);
      setRequests(prev => prev.filter(r => r.id !== id));
      setRejectingId(null);
      setRejectReason('');
      setRejectAlt('');
    });
  };

  const handleBookingSubmit = (formData: FormData) => {
    setBookingError('');
    startTransition(async () => {
      const result = await bookMultiPurposeRoomAsAdmin(formData);
      if (result?.error) {
        setBookingError(result.error);
      } else {
        setBookingSuccess(true);
        setTimeout(() => {
          setShowBookingModal(false);
          setBookingSuccess(false);
        }, 2000);
      }
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0C2340]">Approvals & Overview</h2>
          <p className="text-muted-foreground mt-1">Manage pending requests and review today's activity.</p>
        </div>
        <Button onClick={() => setShowBookingModal(true)} className="bg-[#0C2340] hover:bg-[#0C2340]/90 gap-2">
          <PlusCircle className="w-4 h-4" />
          Book Multi-Purpose Room
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Requests</p>
              <p className="text-3xl font-bold text-slate-800">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Approved Today</p>
              <p className="text-3xl font-bold text-slate-800">{approvedCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Multi-Purpose Today</p>
              <p className="text-3xl font-bold text-slate-800">{multiActiveCount}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-400" />
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>Approve or reject requests. When rejecting, suggest an alternative room or time.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">All clear! No pending requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req.id} className="border rounded-xl bg-white shadow-sm">
                  <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex gap-3 items-start">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <FileText className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{req.rooms?.name ?? 'Unknown Room'}</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">{req.profiles?.full_name}</span>
                          {' · '}{req.profiles?.employee_id}
                          {' · '}📅 {req.date}
                        </p>
                        {req.reason && <p className="text-xs text-slate-400 mt-1 italic">"{req.reason}"</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className={req.room_type === 'multi-purpose' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                        {req.room_type === 'multi-purpose' ? 'Multi-Purpose' : 'Lecture'}
                      </Badge>
                      <Button size="sm" disabled={isPending} onClick={() => handleApprove(req.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓ Approve'}
                      </Button>
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => setRejectingId(rejectingId === req.id ? null : req.id)} className="text-red-600 border-red-200 hover:bg-red-50">
                        ✕ Reject
                      </Button>
                    </div>
                  </div>

                  {rejectingId === req.id && (
                    <div className="px-4 pb-4 border-t bg-red-50/40 rounded-b-xl space-y-3">
                      <p className="text-sm font-semibold text-red-700 pt-3">Rejection Details</p>
                      <div className="space-y-1">
                        <Label className="text-xs">Reason for Rejection <span className="text-red-500">*</span></Label>
                        <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Room occupied by fixed schedule" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Suggest Alternative (optional)</Label>
                        <Input value={rejectAlt} onChange={e => setRejectAlt(e.target.value)} placeholder="e.g. Try Room C at 12 PM or Room A on Tuesday" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={isPending || !rejectReason.trim()} onClick={() => handleRejectSubmit(req.id)} className="bg-red-600 hover:bg-red-700 text-white">
                          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Rejection'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectReason(''); setRejectAlt(''); }}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branch Manager Status List */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Manager Decisions</CardTitle>
          <CardDescription>Track the final status of Multi-Purpose room requests after your initial approval.</CardDescription>
        </CardHeader>
        <CardContent>
          {multiPurposeStatusRequests.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No recent multi-purpose decisions to track.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {multiPurposeStatusRequests.map(req => (
                <div key={req.id} className="border rounded-lg bg-slate-50 p-3 flex items-center justify-between gap-4 flex-wrap text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{req.rooms?.name ?? 'Unknown Room'} <span className="text-slate-400 font-normal">({req.date})</span></p>
                    <p className="text-xs text-slate-500">
                      Req by: {req.profiles?.full_name}
                      {req.reason && <span className="italic ml-2">"{req.reason}"</span>}
                    </p>
                    {req.branch_manager_status === 'rejected' && req.branch_manager_feedback && (
                      <p className="text-xs text-red-600 mt-1">Feedback: {req.branch_manager_feedback}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {req.branch_manager_status === 'pending' && <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>}
                    {req.branch_manager_status === 'approved' && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Approved</Badge>}
                    {req.branch_manager_status === 'rejected' && <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><X className="w-3 h-3 mr-1"/> Rejected</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── MULTI-PURPOSE BOOKING MODAL ─────────────────────────────── */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-bold text-[#0C2340]">Book Multi-Purpose Room</h3>
                <p className="text-xs text-slate-500 mt-0.5">Request goes to Branch Manager for final approval</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setShowBookingModal(false); setBookingError(''); setBookingSuccess(false); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {bookingSuccess ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-semibold text-slate-800">Booking submitted!</p>
                <p className="text-sm text-slate-500 mt-1">Sent to Branch Manager for final approval.</p>
              </div>
            ) : (
              <form action={handleBookingSubmit} className="p-6 space-y-4">
                {bookingError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{bookingError}</div>}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <Label>Room <span className="text-red-500">*</span></Label>
                    <select name="room_id" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Select a room…</option>
                      {multiPurposeRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label>Date <span className="text-red-500">*</span></Label>
                    <Input name="date" type="date" min={today} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Time Slot</Label>
                    <select name="time_slot_id" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Any / Full Day</option>
                      {timeSlots.map(s => <option key={s.id} value={s.id}>{s.slot_name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Purpose / Reason <span className="text-red-500">*</span></Label>
                  <Input name="reason" placeholder="e.g. Departmental seminar" required />
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Responsible Person</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label>Full Name <span className="text-red-500">*</span></Label>
                      <Input name="manager_name" placeholder="Person in charge" required />
                    </div>
                    <div className="space-y-1">
                      <Label>Job Title</Label>
                      <Input name="manager_job_title" placeholder="e.g. Department Head" />
                    </div>
                    <div className="space-y-1">
                      <Label>Mobile</Label>
                      <Input name="manager_mobile" placeholder="01xxxxxxxxx" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Technical Requirements</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 text-sm cursor-pointer">
                      <input type="checkbox" name="has_laptop" className="rounded" />
                      <span>Laptop Required</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm cursor-pointer">
                      <input type="checkbox" name="has_video_conf" className="rounded" />
                      <span>Video Conference Setup</span>
                    </label>
                    <div className="flex items-center gap-3 text-sm">
                      <span>Wireless Microphones:</span>
                      <Input name="mics_count" type="number" min={0} max={10} defaultValue={0} className="w-20 h-8" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isPending} className="flex-1 bg-[#0C2340] hover:bg-[#0C2340]/90">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit to Branch Manager
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowBookingModal(false); setBookingError(''); }}>Cancel</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
