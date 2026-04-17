"use client";

import { useTransition, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, Clock, MapPin, Loader2 } from "lucide-react";
import { addRoom, deleteRoom, toggleRoomActive, addSlot, deleteSlot } from "../actions";

type Room = { id: string; name: string; type: string; is_active: boolean; capacity: number };
type Slot = { id: string; slot_name: string; start_time: string; end_time: string; is_active: boolean };

export function SystemSettings({ rooms, slots }: { rooms: Room[]; slots: Slot[] }) {
  const [isPending, startTransition] = useTransition();
  const [roomError, setRoomError] = useState('');
  const [slotError, setSlotError] = useState('');

  const handleAddRoom = (formData: FormData) => {
    setRoomError('');
    startTransition(async () => {
      const result = await addRoom(formData);
      if (result?.error) setRoomError(result.error);
    });
  };

  const handleDeleteRoom = (id: string) => {
    startTransition(async () => {
      await deleteRoom(id);
    });
  };

  const handleAddSlot = (formData: FormData) => {
    setSlotError('');
    startTransition(async () => {
      const result = await addSlot(formData);
      if (result?.error) setSlotError(result.error);
    });
  };

  const handleDeleteSlot = (id: string) => {
    startTransition(async () => {
      await deleteSlot(id);
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0C2340]">System Configuration</h2>
        <p className="text-muted-foreground mt-2">Manage rooms and configure standard time slots.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ROOMS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-500" />
              Manage Rooms
            </CardTitle>
            <CardDescription>Add or remove physical rooms from the system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form action={handleAddRoom} className="space-y-3 pb-4 border-b">
              {roomError && <p className="text-xs text-red-500">{roomError}</p>}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Room Name</Label>
                  <Input name="name" placeholder="e.g. Lab 404" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <select name="type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="lecture">Lecture / Section</option>
                    <option value="multi-purpose">Multi-Purpose</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Capacity</Label>
                <Input name="capacity" type="number" placeholder="50" min={1} />
              </div>
              <Button type="submit" disabled={isPending} className="w-full bg-[#0C2340] hover:bg-[#0C2340]/90">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                Add Room
              </Button>
            </form>

            <div className="divide-y rounded-md border max-h-72 overflow-y-auto">
              {rooms.length === 0 && <p className="p-4 text-sm text-slate-400 text-center">No rooms yet.</p>}
              {rooms.map(room => (
                <div key={room.id} className="p-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold">{room.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={room.type === 'multi-purpose' ? 'text-purple-600 border-purple-200 text-xs' : 'text-blue-600 border-blue-200 text-xs'}>
                        {room.type === 'multi-purpose' ? 'Multi-Purpose' : 'Lecture'}
                      </Badge>
                      <span className="text-xs text-slate-500">Cap: {room.capacity}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRoom(room.id)} disabled={isPending} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* TIME SLOTS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Time Slots
            </CardTitle>
            <CardDescription>Adjust slot durations (e.g. for Ramadan hours).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form action={handleAddSlot} className="space-y-3 pb-4 border-b">
              {slotError && <p className="text-xs text-red-500">{slotError}</p>}
              <div className="space-y-1">
                <Label className="text-xs">Slot Name</Label>
                <Input name="slot_name" placeholder="e.g. Morning Slot" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input name="start_time" type="time" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input name="end_time" type="time" required />
                </div>
              </div>
              <Button type="submit" disabled={isPending} variant="outline" className="w-full">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                Add Time Slot
              </Button>
            </form>

            <div className="divide-y rounded-md border max-h-72 overflow-y-auto">
              {slots.length === 0 && <p className="p-4 text-sm text-slate-400 text-center">No slots yet.</p>}
              {slots.map(slot => (
                <div key={slot.id} className="p-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{slot.slot_name}</p>
                    <p className="text-xs text-slate-500">{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSlot(slot.id)} disabled={isPending} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
