"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookingRequestSchema, BookingRequestFormValues } from "@/features/bookings/schema";
import { useState, useEffect } from "react";
import { submitBookingRequest } from "@/features/bookings/actions";
import { Button } from "@/components/ui/button";
import { Info, Calendar, Mic, Laptop, Video, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TimeSlot = { id: string; slot_name: string };
type RoomOption = { id: string; name: string; type: "lecture" | "multi-purpose" };

export function NewRequestForm({ onSuccess, role = "employee" }: { onSuccess?: () => void; role?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Fetch time slots and rooms from Supabase on mount
  useEffect(() => {
    const fetchOptions = async () => {
      const supabase = createClient();
      try {
        const [slotsResult, roomsResult] = await Promise.all([
          supabase
            .from("time_slots")
            .select("id, slot_name")
            .eq("is_active", true)
            .order("start_time"),
          supabase
            .from("rooms")
            .select("id, name, type")
            .eq("is_active", true)
            .order("name"),
        ]);

        setTimeSlots(slotsResult.data || []);
        setRooms((roomsResult.data || []) as RoomOption[]);
      } finally {
        setSlotsLoading(false);
        setRoomsLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
    reset,
  } = useForm<BookingRequestFormValues>({
    resolver: zodResolver(BookingRequestSchema),
    defaultValues: {
      roomType: role === "secretary" ? "multi-purpose" : "lecture",
      roomId: "",
      date: "",
      timeSlotId: "",
      reason: "",
      managerName: "",
      managerJobTitle: "",
      managerMobile: "",
      micsCount: 0,
      hasLaptop: false,
      hasVideoConf: false,
    },
  });

  const selectedRoomType = useWatch({ control, name: "roomType" }) || (role === "secretary" ? "multi-purpose" : "lecture");
  const availableRooms = rooms.filter((room) => room.type === selectedRoomType);

  useEffect(() => {
    setValue("roomId", "");
  }, [selectedRoomType, setValue]);

  // Compute minimum date based on role
  const now = new Date();
  const minHoursNeeded = role === "secretary" ? 48 : 24;
  const minDateObj = new Date(now.getTime() + minHoursNeeded * 60 * 60 * 1000);
  const minDateStr = minDateObj.toISOString().split("T")[0];

  const onSubmit = async (data: BookingRequestFormValues) => {
    setIsSubmitting(true);
    setServerError("");

    try {
      const result = await submitBookingRequest({
        roomType: data.roomType,
        roomId: data.roomId,
        date: data.date,
        timeSlotId: data.timeSlotId,
        reason: data.reason,
        managerName: data.managerName,
        managerJobTitle: data.managerJobTitle,
        managerMobile: data.managerMobile,
        micsCount: data.micsCount,
        hasLaptop: data.hasLaptop,
        hasVideoConf: data.hasVideoConf,
      });
      if (result.success) {
        reset();
        if (onSuccess) onSuccess();
      } else {
        setServerError(result.error || "An unknown error occurred.");
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-100 bg-slate-50/30">
        <h3 className="text-lg font-semibold text-[#0C2340]">Submit New Request</h3>
        <p className="text-sm text-slate-500">
          Role: <span className="font-semibold capitalize text-slate-700">{role}</span>. Minimum notice required is {minHoursNeeded} hours.
        </p>
      </div>

      <div className="p-6">
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100 flex items-start gap-3">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p>{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
          {/* Room Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Room / Area Type</label>
            <div className="grid grid-cols-2 gap-4">
              {role !== "secretary" && (
                <label className="cursor-pointer relative">
                  <input type="radio" value="lecture" className="peer sr-only" {...register("roomType")} />
                  <div className="p-4 rounded-xl border border-slate-200 peer-checked:border-[#0C2340] peer-checked:bg-[#0C2340]/5 transition-all outline-none peer-focus:ring-2 ring-[#0C2340]/20">
                    <span className="block text-sm font-medium text-slate-800">Lecture Room</span>
                    <span className="block text-xs text-slate-500 mt-1">Exceptional Lectures</span>
                  </div>
                </label>
              )}
              <label className="cursor-pointer relative">
                <input type="radio" value="multi-purpose" className="peer sr-only" {...register("roomType")} />
                <div className="p-4 rounded-xl border border-slate-200 peer-checked:border-[#0C2340] peer-checked:bg-[#0C2340]/5 transition-all outline-none peer-focus:ring-2 ring-[#0C2340]/20">
                  <span className="block text-sm font-medium text-slate-800">Multi-Purpose Room</span>
                  <span className="block text-xs text-slate-500 mt-1">Events & VIP seminars</span>
                </div>
              </label>
            </div>
            {errors.roomType && <p className="text-red-500 text-xs mt-2">{errors.roomType.message}</p>}
          </div>

          {/* Room Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Room Name</label>
            <select
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] outline-none transition-shadow disabled:opacity-70"
              disabled={roomsLoading || availableRooms.length === 0}
              {...register("roomId")}
            >
              <option value="">
                {roomsLoading
                  ? "Loading rooms..."
                  : availableRooms.length === 0
                  ? "No rooms available for selected type"
                  : "Select a room..."}
              </option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
            {errors.roomId && <p className="text-red-500 text-xs mt-2">{errors.roomId.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  min={minDateStr}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] outline-none transition-shadow"
                  {...register("date")}
                />
              </div>
              {errors.date && <p className="text-red-500 text-xs mt-2">{errors.date.message}</p>}
            </div>

            {/* Time Slot */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred Slot</label>
              <select
                className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] outline-none transition-shadow disabled:opacity-70"
                disabled={slotsLoading}
                {...register("timeSlotId")}
              >
                <option value="">{slotsLoading ? "Loading slots..." : "Select a slot..."}</option>
                {timeSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.slot_name}
                  </option>
                ))}
              </select>
              {errors.timeSlotId && <p className="text-red-500 text-xs mt-2">{errors.timeSlotId.message}</p>}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Purpose of Use</label>
            <textarea
              rows={3}
              placeholder="Provide a brief explanation for this request..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] outline-none transition-shadow resize-none"
              {...register("reason")}
            />
            {errors.reason && <p className="text-red-500 text-xs mt-2">{errors.reason.message}</p>}
          </div>

          {/* Multi-Purpose Dynamic Details */}
          {selectedRoomType === "multi-purpose" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h4 className="font-semibold text-[#0C2340] mb-4 border-b border-slate-200 pb-2">Event Manager Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] outline-none" {...register("managerName")} />
                  {errors.managerName && <p className="text-red-500 text-xs mt-1">{errors.managerName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Job Title</label>
                  <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] outline-none" {...register("managerJobTitle")} />
                  {errors.managerJobTitle && <p className="text-red-500 text-xs mt-1">{errors.managerJobTitle.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number</label>
                  <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] outline-none" {...register("managerMobile")} />
                  {errors.managerMobile && <p className="text-red-500 text-xs mt-1">{errors.managerMobile.message}</p>}
                </div>
              </div>

              <h4 className="font-semibold text-[#0C2340] mt-6 mb-4 border-b border-slate-200 pb-2">Technical Requirements</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-[#0C2340]/40 transition-colors">
                  <input type="checkbox" className="w-4 h-4 text-[#0C2340] rounded focus:ring-[#0C2340]" {...register("hasLaptop")} />
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Laptop</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-[#0C2340]/40 transition-colors">
                  <input type="checkbox" className="w-4 h-4 text-[#0C2340] rounded focus:ring-[#0C2340]" {...register("hasVideoConf")} />
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Video Conf.</span>
                  </div>
                </label>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4 text-slate-400" />
                    <label className="text-sm font-medium text-slate-700">Microphones</label>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Qty"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:border-[#0C2340] focus:ring-1 focus:ring-[#0C2340] outline-none"
                    {...register("micsCount", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              className="bg-[#0C2340] hover:bg-[#0C2340]/90 text-white px-8 py-2.5 rounded-xl transition-all disabled:opacity-50 h-auto font-medium flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Submitting Request..." : "Submit Blind Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
