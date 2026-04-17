"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitBookingRequest(formData: {
  roomType: string;
  roomId: string;
  date: string;
  timeSlotId: string; // UUID of the selected time slot
  reason: string;
  managerName?: string;
  managerJobTitle?: string;
  managerMobile?: string;
  micsCount?: number;
  hasLaptop?: boolean;
  hasVideoConf?: boolean;
}) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  if (!formData.roomId) {
    return { success: false, error: "Please select a room." };
  }

  const { data: selectedRoom, error: roomError } = await supabase
    .from("rooms")
    .select("id, type, is_active")
    .eq("id", formData.roomId)
    .single();

  if (roomError || !selectedRoom || !selectedRoom.is_active) {
    return { success: false, error: "Selected room is not available." };
  }

  if (selectedRoom.type !== formData.roomType) {
    return { success: false, error: "Selected room does not match the chosen room type." };
  }

  // Determine initial status — multi-purpose bookings go through branch manager
  // Both start as 'pending' for Admin first
  const { error } = await supabase.from("bookings").insert({
    user_id: userData.user.id,
    room_id: formData.roomId,
    room_type: formData.roomType,
    date: formData.date,
    time_slot_id: formData.timeSlotId,
    reason: formData.reason,
    manager_name: formData.managerName,
    manager_job_title: formData.managerJobTitle,
    manager_mobile: formData.managerMobile,
    mics_count: formData.micsCount || 0,
    has_laptop: formData.hasLaptop || false,
    has_video_conf: formData.hasVideoConf || false,
    status: "pending",
    // For multi-purpose, branch manager must also approve after admin
    branch_manager_status: formData.roomType === "multi-purpose" ? "pending" : null,
  });

  if (error) {
    console.error("Error creating booking:", error);
    return { success: false, error: "Failed to submit booking request. Please try again." };
  }

  revalidatePath("/employee");
  return { success: true };
}
