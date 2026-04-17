"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, FileText, Loader2, PlusCircle, X } from "lucide-react";
import { approveBooking, rejectBooking, bookMultiPurposeRoomAsAdmin, updateBookingSchedule } from "../actions";

type Booking = {
  id: string;
  room_id?: string | null;
  time_slot_id?: string | null;
  room_type: string;
  date: string;
  reason: string;
  status: string;
  admin_feedback?: string;
  branch_manager_status?: string;
  branch_manager_feedback?: string;
  rooms: { name: string }[] | { name: string } | null;
  time_slots?: { slot_name: string }[] | { slot_name: string } | null;
  profiles: { full_name: string; employee_id: string }[] | { full_name: string; employee_id: string } | null;
};

type Room = { id: string; name: string; type: string };
type Slot = { id: string; slot_name: string; start_time: string; end_time: string };

interface Props {
  initialRequests: Booking[];
  pendingCount: number;
  approvedCount: number;
  multiActiveCount: number;
  allRooms: Room[];
  timeSlots: Slot[];
  bookingOccupancies: BookingOccupancy[];
  recentDecisions?: Booking[];
  multiPurposeStatusRequests?: Booking[];
}

type BookingOccupancy = {
  id: string;
  date: string;
  room_id: string;
  time_slot_id: string | null;
  status: "pending" | "approved";
};

function oneToOne<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function AdminDashboard({ initialRequests, pendingCount, approvedCount, multiActiveCount, allRooms, timeSlots, bookingOccupancies, recentDecisions = [], multiPurposeStatusRequests = [] }: Props) {
  const [requests, setRequests] = useState<Booking[]>(initialRequests);
  const [isPending, startTransition] = useTransition();
  const [occupancies, setOccupancies] = useState<BookingOccupancy[]>(bookingOccupancies);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectAlt, setRejectAlt] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRoomId, setEditRoomId] = useState('');
  const [editTimeSlotId, setEditTimeSlotId] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccessId, setEditSuccessId] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const multiPurposeRooms = useMemo(
    () => allRooms.filter((room) => room.type === 'multi-purpose'),
    [allRooms]
  );

  const roomsById = useMemo(
    () => new Map(allRooms.map((room) => [room.id, room])),
    [allRooms]
  );

  const slotsById = useMemo(
    () => new Map(timeSlots.map((slot) => [slot.id, slot])),
    [timeSlots]
  );

  const clearScheduleEditor = () => {
    setEditingId(null);
    setEditRoomId('');
    setEditTimeSlotId('');
    setEditError('');
  };

  const isRoomAvailableForSlot = (roomId: string, date: string, timeSlotId: string, bookingId: string) => {
    return !occupancies.some((occupied) => (
      occupied.date === date
      && occupied.room_id === roomId
      && occupied.id !== bookingId
      && (occupied.time_slot_id === null || occupied.time_slot_id === timeSlotId)
    ));
  };

  const getAvailableRoomsForBooking = (booking: Booking, timeSlotId: string) => {
    if (!timeSlotId) return [];

    return allRooms.filter((room) => (
      room.type === booking.room_type
      && isRoomAvailableForSlot(room.id, booking.date, timeSlotId, booking.id)
    ));
  };

  const openScheduleEditor = (booking: Booking) => {
    if (editingId === booking.id) {
      clearScheduleEditor();
      return;
    }

    const initialTimeSlotId = booking.time_slot_id ?? '';
    const initialAvailableRooms = initialTimeSlotId
      ? getAvailableRoomsForBooking(booking, initialTimeSlotId)
      : [];
    const preferredRoomId = booking.room_id && initialAvailableRooms.some((room) => room.id === booking.room_id)
      ? booking.room_id
      : (initialAvailableRooms[0]?.id ?? '');

    setRejectingId(null);
    setRejectReason('');
    setRejectAlt('');
    setEditSuccessId(null);
    setEditingId(booking.id);
    setEditTimeSlotId(initialTimeSlotId);
    setEditRoomId(preferredRoomId);
    setEditError('');
  };

  const toggleRejectEditor = (bookingId: string) => {
    if (rejectingId === bookingId) {
      setRejectingId(null);
      setRejectReason('');
      setRejectAlt('');
      return;
    }

    clearScheduleEditor();
    setEditSuccessId(null);
    setRejectingId(bookingId);
  };

  const handleEditSchedule = (booking: Booking) => {
    if (!editTimeSlotId) {
      setEditError('Please choose a time slot.');
      return;
    }

    if (!editRoomId) {
      setEditError('Please choose an available room.');
      return;
    }

    if (!isRoomAvailableForSlot(editRoomId, booking.date, editTimeSlotId, booking.id)) {
      setEditError('This room is no longer available at the selected time.');
      return;
    }

    setEditError('');
    startTransition(async () => {
      const result = await updateBookingSchedule(booking.id, editRoomId, editTimeSlotId);

      if (result?.error) {
        setEditError(result.error);
        return;
      }

      const nextRoom = roomsById.get(editRoomId);
      const nextSlot = slotsById.get(editTimeSlotId);

      setRequests((current) => current.map((request) => (
        request.id === booking.id
          ? {
              ...request,
              room_id: editRoomId,
              time_slot_id: editTimeSlotId,
              rooms: nextRoom ? { name: nextRoom.name } : request.rooms,
              time_slots: nextSlot ? { slot_name: nextSlot.slot_name } : request.time_slots,
            }
          : request
      )));

      setOccupancies((current) => [
        ...current.filter((occupied) => occupied.id !== booking.id),
        {
          id: booking.id,
          date: booking.date,
          room_id: editRoomId,
          time_slot_id: editTimeSlotId,
          status: 'pending',
        },
      ]);

      clearScheduleEditor();
      setEditSuccessId(booking.id);
      setTimeout(() => {
        setEditSuccessId((current) => current === booking.id ? null : current);
      }, 2000);
    });
  };

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const result = await approveBooking(id);
      if (result?.error) return;

      setRequests(prev => prev.filter(r => r.id !== id));
      setOccupancies((current) => current.map((occupied) => (
        occupied.id === id
          ? { ...occupied, status: 'approved' }
          : occupied
      )));

      if (editingId === id) {
        clearScheduleEditor();
      }
    });
  };

  const handleRejectSubmit = (id: string) => {
    if (!rejectReason.trim()) return;
    startTransition(async () => {
      const result = await rejectBooking(id, rejectReason, rejectAlt);
      if (result?.error) return;

      setRequests(prev => prev.filter(r => r.id !== id));
      setOccupancies((current) => current.filter((occupied) => occupied.id !== id));
      setRejectingId(null);
      setRejectReason('');
      setRejectAlt('');

      if (editingId === id) {
        clearScheduleEditor();
      }
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
          <p className="text-muted-foreground mt-1">Manage pending requests and review today&apos;s activity.</p>
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
              <p className="text-sm font-medium text-slate-500">Total Approved</p>
              <p className="text-3xl font-bold text-slate-800">{approvedCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Approved Multi-Purpose</p>
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
                (() => {
                  const requestRoom = oneToOne(req.rooms);
                  const requestProfile = oneToOne(req.profiles);
                  const requestSlot = oneToOne(req.time_slots);

                  return (
                <div key={req.id} className="border rounded-xl bg-white shadow-sm">
                  <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex gap-3 items-start">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <FileText className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{requestRoom?.name ?? 'Unknown Room'}</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-700">{requestProfile?.full_name}</span>
                          {' · '}{requestProfile?.employee_id}
                          {' · '}📅 {req.date}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Current Slot: {requestSlot?.slot_name ?? 'No slot selected'}
                        </p>
                        {editSuccessId === req.id && (
                          <p className="text-xs text-emerald-600 mt-1 font-medium">Schedule updated successfully.</p>
                        )}
                        {req.reason && <p className="text-xs text-slate-400 mt-1 italic">&quot;{req.reason}&quot;</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className={req.room_type === 'multi-purpose' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                        {req.room_type === 'multi-purpose' ? 'Multi-Purpose' : 'Lecture'}
                      </Badge>
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => openScheduleEditor(req)} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                        {editingId === req.id ? 'Cancel Edit' : 'Edit Schedule'}
                      </Button>
                      <Button size="sm" disabled={isPending} onClick={() => handleApprove(req.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓ Approve'}
                      </Button>
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => toggleRejectEditor(req.id)} className="text-red-600 border-red-200 hover:bg-red-50">
                        ✕ Reject
                      </Button>
                    </div>
                  </div>

                  {editingId === req.id && (
                    <div className="px-4 pb-4 border-t bg-blue-50/40 rounded-b-xl space-y-3">
                      <p className="text-sm font-semibold text-blue-700 pt-3">Edit Room & Time</p>

                      {(() => {
                        const availableRooms = getAvailableRoomsForBooking(req, editTimeSlotId);

                        return (
                          <>
                            <div className="space-y-1">
                              <Label className="text-xs">Time Slot <span className="text-red-500">*</span></Label>
                              <select
                                value={editTimeSlotId}
                                onChange={(e) => {
                                  const nextTimeSlotId = e.target.value;
                                  setEditTimeSlotId(nextTimeSlotId);
                                  setEditError('');

                                  const roomsForSlot = getAvailableRoomsForBooking(req, nextTimeSlotId);
                                  setEditRoomId((current) => (
                                    roomsForSlot.some((room) => room.id === current)
                                      ? current
                                      : (roomsForSlot[0]?.id ?? '')
                                  ));
                                }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              >
                                <option value="">Select time slot…</option>
                                {timeSlots.map((slot) => (
                                  <option key={slot.id} value={slot.id}>
                                    {slot.slot_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Available Room <span className="text-red-500">*</span></Label>
                              <select
                                value={editRoomId}
                                onChange={(e) => {
                                  setEditRoomId(e.target.value);
                                  setEditError('');
                                }}
                                disabled={!editTimeSlotId}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-slate-100"
                              >
                                <option value="">{editTimeSlotId ? 'Select room…' : 'Pick time first'}</option>
                                {availableRooms.map((room) => (
                                  <option key={room.id} value={room.id}>
                                    {room.name}
                                  </option>
                                ))}
                              </select>
                              {editTimeSlotId && availableRooms.length === 0 && (
                                <p className="text-xs text-amber-600">No rooms available for this request type at the selected time.</p>
                              )}
                            </div>

                            {editError && (
                              <p className="text-xs text-red-600">{editError}</p>
                            )}

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={isPending || !editRoomId || !editTimeSlotId}
                                onClick={() => handleEditSchedule(req)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Schedule'}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={clearScheduleEditor}>Cancel</Button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

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
                  );
                })()
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Admin Recent Decisions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Decisions</CardTitle>
            <CardDescription>Your latest accepted or rejected requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDecisions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No recent decisions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDecisions.map((req) => {
                  const decisionRoom = oneToOne(req.rooms);
                  const decisionProfile = oneToOne(req.profiles);

                  return (
                    <div key={req.id} className="border rounded-lg bg-slate-50 p-3 flex items-center justify-between gap-4 flex-wrap text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{decisionRoom?.name ?? 'Unknown Room'} <span className="text-slate-400 font-normal">({req.date})</span></p>
                        <p className="text-xs text-slate-500">
                          Req by: {decisionProfile?.full_name}
                        </p>
                        {req.status === 'rejected' && req.admin_feedback && (
                          <p className="text-xs text-red-600 mt-1">Reason: {req.admin_feedback}</p>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {req.status === 'approved' && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Approved</Badge>}
                        {req.status === 'rejected' && <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><X className="w-3 h-3 mr-1"/> Rejected</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branch Manager Status Tracker */}
        <Card>
          <CardHeader>
            <CardTitle>Branch Manager Tracking</CardTitle>
            <CardDescription>Final status of Multi-Purpose room requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {multiPurposeStatusRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No branch manager trackings.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {multiPurposeStatusRequests.map((req) => {
                  const statusRoom = oneToOne(req.rooms);
                  const statusProfile = oneToOne(req.profiles);

                  return (
                    <div key={req.id} className="border rounded-lg bg-slate-50 p-3 flex items-center justify-between gap-4 flex-wrap text-sm">
                      <div>
                        <p className="font-semibold text-slate-800">{statusRoom?.name ?? 'Unknown Room'} <span className="text-slate-400 font-normal">({req.date})</span></p>
                        <p className="text-xs text-slate-500">
                          Req by: {statusProfile?.full_name}
                        </p>
                        {req.branch_manager_status === 'rejected' && req.branch_manager_feedback && (
                          <p className="text-xs text-red-600 mt-1">Feedback: {req.branch_manager_feedback}</p>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {req.branch_manager_status === 'pending' && <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200"><Clock className="w-3 h-3 mr-1"/> Pending BM</Badge>}
                        {req.branch_manager_status === 'approved' && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Approved</Badge>}
                        {req.branch_manager_status === 'rejected' && <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><X className="w-3 h-3 mr-1"/> Rejected</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
