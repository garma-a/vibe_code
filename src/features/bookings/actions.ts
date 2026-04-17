"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitBookingRequest(formData: {
  roomType: string;
  date: string;
  timeSlot: string;
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

  const { error } = await supabase.from("bookings").insert({
    user_id: userData.user.id,
    room_type: formData.roomType,
    date: formData.date,
    time_slot: formData.timeSlot,
    reason: formData.reason,
    manager_name: formData.managerName,
    manager_job_title: formData.managerJobTitle,
    manager_mobile: formData.managerMobile,
    mics_count: formData.micsCount || 0,
    has_laptop: formData.hasLaptop || false,
    has_video_conf: formData.hasVideoConf || false,
    status: "pending", // Initially pending for admin/manager approval
  });

  if (error) {
    console.error("Error creating booking:", error);
    return { success: false, error: "Failed to submit booking request. Please try again." };
  }

  revalidatePath("/employee");
  return { success: true };
}
