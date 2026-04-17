"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Room = { id: string; name: string; type: string };
type Slot = { id: string; slot_name: string; start_time: string; end_time: string };

export function EmptyRoomsSearch({ rooms, slots }: { rooms: Room[]; slots: Slot[] }) {
  const [date, setDate] = useState('');
  const [slotId, setSlotId] = useState('');
  const [roomType, setRoomType] = useState('any');
  const [results, setResults] = useState<Room[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    startTransition(async () => {
      const supabase = createClient();

      // Get confirmed bookings for the given date and slot
      let query = supabase
        .from('bookings')
        .select('room_id')
        .eq('date', date)
        .eq('status', 'approved');

      if (slotId) query = query.eq('time_slot_id', slotId);

      const { data: bookedRows } = await query;
      const bookedRoomIds = new Set((bookedRows ?? []).map((b: any) => b.room_id));

      // Filter rooms that are NOT booked
      let filteredRooms = rooms.filter(r => !bookedRoomIds.has(r.id));
      if (roomType !== 'any') filteredRooms = filteredRooms.filter(r => r.type === roomType);

      setResults(filteredRooms);
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0C2340]">Find Empty Rooms</h2>
        <p className="text-muted-foreground mt-2">Search for rooms with zero confirmed bookings at a specific time.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Time Slot</Label>
              <select
                value={slotId}
                onChange={e => setSlotId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Any Slot</option>
                {slots.map(s => (
                  <option key={s.id} value={s.id}>{s.slot_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Room Type</Label>
              <select
                value={roomType}
                onChange={e => setRoomType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="any">All Types</option>
                <option value="lecture">Lecture / Section</option>
                <option value="multi-purpose">Multi-Purpose</option>
              </select>
            </div>
            <Button type="submit" disabled={isPending} className="bg-[#0C2340] hover:bg-[#0C2340]/90 w-full">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {results !== null && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-700">
            {results.length === 0
              ? '❌ No available rooms match your criteria.'
              : `✅ ${results.length} room${results.length > 1 ? 's' : ''} available`}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(room => (
              <div key={room.id} className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl flex items-start gap-3 shadow-sm">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{room.name}</h4>
                  <Badge variant="outline" className={room.type === 'multi-purpose' ? 'text-purple-600 border-purple-200 text-xs mt-1' : 'text-blue-600 border-blue-200 text-xs mt-1'}>
                    {room.type === 'multi-purpose' ? 'Multi-Purpose' : 'Lecture'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
