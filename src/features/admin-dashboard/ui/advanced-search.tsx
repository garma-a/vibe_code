"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Search, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const searchSchema = z.object({
  date: z.string().min(1, "Date is required"),
  timeSlotId: z.string().min(1, "Time slot is required"),
  roomType: z.string()
});

type SearchForm = z.infer<typeof searchSchema>;

interface TimeSlot { id: string; slot_name: string; start_time: string }
interface Room { id: string; name: string; type: string; capacity: number }

interface AdvancedSearchProps {
  timeSlots: TimeSlot[];
  searchAction: (date: string, timeSlotId: string, roomType: string) => Promise<any[]>;
  assignAction: (data: any) => Promise<{ success: boolean }>;
}

export function AdvancedSearch({ timeSlots, searchAction, assignAction }: AdvancedSearchProps) {
  const [results, setResults] = useState<Room[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // For forcing assignment
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [assignData, setAssignData] = useState({ employeeId: "", reason: "" });
  const [isAssigning, setIsAssigning] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
    defaultValues: { roomType: "all", date: new Date().toISOString().split('T')[0] }
  });

  const watchDate = watch("date");
  const watchTimeSlotId = watch("timeSlotId");

  const onSubmit = async (data: SearchForm) => {
    setIsSearching(true);
    try {
      const emptyRooms = await searchAction(data.date, data.timeSlotId, data.roomType);
      setResults(emptyRooms as Room[]);
    } catch (e) {
      console.error(e);
    }
    setIsSearching(false);
  };

  const handleForceAssign = async () => {
    if (!selectedRoom || !assignData.employeeId || !assignData.reason) return;
    setIsAssigning(true);
    try {
      await assignAction({
        employeeId: assignData.employeeId,
        roomId: selectedRoom.id,
        date: watchDate,
        timeSlotId: watchTimeSlotId,
        reason: assignData.reason,
        roomType: selectedRoom.type
      });
      setSelectedRoom(null);
      setAssignData({ employeeId: "", reason: "" });
      // Re-run search
      handleSubmit(onSubmit)();
    } catch (e) {
      console.error(e);
    }
    setIsAssigning(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Search className="text-blue-500 w-5 h-5" />
          Find Empty Rooms
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Date</label>
            <input 
              type="date"
              className="w-full text-slate-800 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              {...register("date")}
            />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Time Slot</label>
            <select 
              className="w-full text-slate-800 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              {...register("timeSlotId")}
            >
              <option value="">Select a time slot...</option>
              {timeSlots.map(ts => (
                <option key={ts.id} value={ts.id}>{ts.slot_name}</option>
              ))}
            </select>
            {errors.timeSlotId && <p className="text-red-500 text-xs mt-1">{errors.timeSlotId.message}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1">Room Type</label>
            <select 
              className="w-full text-slate-800 border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              {...register("roomType")}
            >
              <option value="all">Any Type</option>
              <option value="lecture">Lecture Room</option>
              <option value="multi-purpose">Multi-Purpose</option>
            </select>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isSearching}>
            {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Search
          </Button>
        </form>
      </div>

      {results && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex justify-between items-center">
            <span>Search Results</span>
            <span className="text-sm font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
              {results.length} Available
            </span>
          </h3>
          
          {results.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
              No rooms are available for the selected criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(room => (
                <div key={room.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition bg-slate-50 relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800">{room.name}</h4>
                      <p className="text-xs font-semibold text-slate-500 uppercase mt-1 tracking-wide">{room.type}</p>
                    </div>
                    <div className="bg-white px-2 py-1 rounded shadow-sm border text-xs font-bold text-slate-600">
                      Cap: {room.capacity}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4 bg-white hover:bg-blue-50 hover:text-blue-700 border-slate-200"
                    onClick={() => setSelectedRoom(room)}
                  >
                    Force Assign Room
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Force Assign Dialog */}
      <Dialog open={!!selectedRoom} onOpenChange={(o) => !o && setSelectedRoom(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Room on Behalf of Employee</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4 py-4 text-slate-700">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
                <p><strong>Room:</strong> {selectedRoom.name}</p>
                <p><strong>Date:</strong> {watchDate}</p>
                <p><strong>Slot:</strong> {timeSlots.find(t => t.id === watchTimeSlotId)?.slot_name}</p>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">Employee ID / Name:</label>
                <input 
                  type="text" 
                  className="w-full text-sm p-2 border rounded-md"
                  placeholder="e.g. EMP-1234 or Dr. Smith"
                  value={assignData.employeeId}
                  onChange={e => setAssignData({ ...assignData, employeeId: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">Reason / Purpose:</label>
                <input 
                  type="text" 
                  className="w-full text-sm p-2 border rounded-md"
                  placeholder="Purpose of the booking"
                  value={assignData.reason}
                  onChange={e => setAssignData({ ...assignData, reason: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRoom(null)}>Cancel</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleForceAssign}
              disabled={!assignData.employeeId || !assignData.reason || isAssigning}
            >
              {isAssigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Assign Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
