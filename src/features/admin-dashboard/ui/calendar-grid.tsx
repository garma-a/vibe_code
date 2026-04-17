"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Room { id: string; name: string; type: string }
interface TimeSlot { id: string; slot_name: string; start_time: string }
interface Booking { id: string; room_id: string; time_slot_id: string; status: string; reason: string; profiles?: { full_name: string } }

interface CalendarGridProps {
  rooms: Room[];
  timeSlots: TimeSlot[];
  fetchBookingsAction: (date: string) => Promise<any[]>;
  approveAction: (id: string) => Promise<{ success: boolean }>;
  rejectAction: (id: string, feedback: string) => Promise<{ success: boolean }>;
}

export function CalendarGrid({ rooms, timeSlots, fetchBookingsAction, approveAction, rejectAction }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [feedback, setFeedback] = useState("");

  const loadBookings = async (date: Date) => {
    setIsLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const data = await fetchBookingsAction(dateStr);
    setBookings(data as Booking[]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadBookings(currentDate);
  }, [currentDate]);

  const handleApprove = async () => {
    if (!selectedBooking) return;
    try {
      await approveAction(selectedBooking.id);
      setSelectedBooking(null);
      loadBookings(currentDate);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking) return;
    try {
      await rejectAction(selectedBooking.id, feedback || "Rejected by Admin");
      setSelectedBooking(null);
      setFeedback("");
      loadBookings(currentDate);
    } catch (e) {
      console.error(e);
    }
  };

  const getBookingForSlot = (roomId: string, timeSlotId: string) => {
    return bookings.find(b => b.room_id === roomId && b.time_slot_id === timeSlotId);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-slate-800">
      
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
        <h2 className="font-semibold text-lg">Daily Schedule Overview</h2>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subDays(currentDate, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="font-medium text-slate-900 w-32 text-center">
            {format(currentDate, "EEE, MMM d")}
          </div>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid wrapper */}
      <div className="flex-1 overflow-auto p-4 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm">
            <span className="font-medium text-blue-600">Loading...</span>
          </div>
        )}
        
        <div className="min-w-max border border-slate-200 rounded-lg overflow-hidden">
          {/* Header Row (Time Slots) */}
          <div className="flex bg-slate-100 border-b border-slate-200">
            <div className="w-48 flex-shrink-0 p-3 font-semibold text-slate-700 border-r border-slate-200 sticky left-0 z-20 bg-slate-100">
              Room \ Time
            </div>
            {timeSlots.map(ts => (
              <div key={ts.id} className="w-40 flex-shrink-0 p-3 text-center text-sm font-medium text-slate-600 border-r border-slate-200">
                {ts.slot_name}
              </div>
            ))}
          </div>

          {/* Body Rows (Rooms) */}
          {rooms.map(room => (
            <div key={room.id} className="flex border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
              <div className="w-48 flex-shrink-0 p-3 font-medium text-slate-800 border-r border-slate-200 sticky left-0 z-10 bg-white flex flex-col justify-center shadow-[1px_0_4px_rgba(0,0,0,0.05)]">
                <span>{room.name}</span>
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{room.type}</span>
              </div>
              
              {timeSlots.map(ts => {
                const booking = getBookingForSlot(room.id, ts.id);
                return (
                  <div key={ts.id} className="w-40 flex-shrink-0 p-1.5 border-r border-slate-100 relative group">
                    {booking ? (
                      <div 
                        onClick={() => setSelectedBooking(booking)}
                        className={`h-full w-full rounded-md p-2 cursor-pointer transition flex flex-col justify-center border shadow-sm ${
                          booking.status === 'approved' 
                            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                            : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                        }`}
                      >
                        <span className={`text-xs font-semibold truncate ${booking.status === 'approved' ? 'text-blue-800' : 'text-orange-800'}`}>
                          {booking.profiles?.full_name || 'Unknown'}
                        </span>
                        <span className={`text-[10px] uppercase font-bold mt-1 ${booking.status === 'approved' ? 'text-blue-500' : 'text-orange-500'}`}>
                          {booking.status}
                        </span>
                      </div>
                    ) : (
                      <div className="h-full w-full rounded-md border border-dashed border-transparent hover:border-slate-200 transition" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(o) => !o && setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Booking</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4 text-slate-700">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="font-medium">Requester:</span>
                <span className="col-span-2">{selectedBooking.profiles?.full_name}</span>
                
                <span className="font-medium">Status:</span>
                <span className="col-span-2 capitalize font-semibold">{selectedBooking.status}</span>
                
                <span className="font-medium">Reason:</span>
                <span className="col-span-2 text-slate-500 italic">{selectedBooking.reason}</span>
              </div>

              {selectedBooking.status === 'pending' && (
                <div className="pt-4 border-t">
                  <label className="text-xs font-semibold mb-1 block">Rejection Feedback (if rejecting):</label>
                  <input 
                    type="text" 
                    className="w-full text-sm p-2 border rounded-md"
                    placeholder="Provide reason for rejection..."
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-end gap-2">
            {selectedBooking?.status === 'pending' && (
              <>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={handleReject}>
                  <X className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApprove}>
                  <Check className="w-4 h-4 mr-2" /> Approve
                </Button>
              </>
            )}
            {selectedBooking?.status === 'approved' && (
              <Button variant="outline" className="text-red-600 border-red-200" onClick={handleReject}>
                Revoke Approval
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
